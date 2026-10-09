// ===== Konfigurasi =====
const STOCKS = [
  { code: 'BBCA.JK', name: 'Bank Central Asia' },
  { code: 'BBRI.JK', name: 'Bank Rakyat Indonesia' },
  { code: 'BMRI.JK', name: 'Bank Mandiri' },
  { code: 'TLKM.JK', name: 'Telkom Indonesia' },
  { code: 'ASII.JK', name: 'Astra International' },
  { code: 'GOTO.JK', name: 'GoTo Gojek Tokopedia' },
];

// ===== Helper =====
function formatIDR(num) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(num, decimals = 2) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

function setLoading(el, loading = true) {
  if (loading) el.classList.add('loading');
  else el.classList.remove('loading');
}

// ===== Fetch USD/IDR =====
async function fetchUSD() {
  const priceEl = document.getElementById('usdPrice');
  const metaEl = document.getElementById('usdMeta');
  setLoading(priceEl, true);

  try {
    // Free currency API (no key needed)
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    const data = await res.json();
    const idr = data.usd?.idr;

    if (idr) {
      priceEl.textContent = formatIDR(idr);
      metaEl.textContent = `1 USD = ${formatNumber(idr, 2)} IDR · Sumber: currency-api`;
    } else {
      throw new Error('Data IDR tidak ditemukan');
    }
  } catch (err) {
    console.error('USD error:', err);
    priceEl.textContent = 'Gagal memuat';
    metaEl.textContent = 'Coba refresh atau cek koneksi';
  } finally {
    setLoading(priceEl, false);
  }
}

// ===== Fetch Emas =====
async function fetchGold() {
  const priceEl = document.getElementById('goldPrice');
  const metaEl = document.getElementById('goldMeta');
  const detailsEl = document.getElementById('goldDetails');
  setLoading(priceEl, true);

  try {
    // Logam Mulia API (Indonesia gold prices)
    const res = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/anekalogam');
    const data = await res.json();

    // Struktur respons bisa bervariasi, coba beberapa kemungkinan
    let buy = null, sell = null, source = 'Aneka Logam';

    if (data?.data) {
      const d = data.data;
      // Cari harga per gram atau yang paling umum
      if (Array.isArray(d)) {
        const item = d.find(x => x.weight == 1 || x.berat == 1 || x.unit === 'gram') || d[0];
        buy = item?.buy || item?.beli || item?.harga_beli;
        sell = item?.sell || item?.jual || item?.harga_jual;
      } else {
        buy = d.buy || d.beli || d.harga_beli || d.price;
        sell = d.sell || d.jual || d.harga_jual;
      }
    } else if (data?.buy || data?.harga) {
      buy = data.buy || data.harga;
      sell = data.sell;
    }

    // Fallback: coba endpoint lain jika kosong
    if (!buy && !sell) {
      const res2 = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/hargaemas-org');
      const data2 = await res2.json();
      if (data2?.data) {
        const d = Array.isArray(data2.data) ? data2.data[0] : data2.data;
        buy = d?.buy || d?.beli || d?.harga;
        sell = d?.sell || d?.jual;
        source = 'Harga Emas Org';
      }
    }

    if (buy || sell) {
      const mainPrice = buy || sell;
      priceEl.textContent = formatIDR(mainPrice);
      metaEl.textContent = `Sumber: ${source}`;

      let details = '';
      if (buy) details += `<span>Beli: <strong>${formatIDR(buy)}</strong></span>`;
      if (sell) details += `<span>Jual: <strong>${formatIDR(sell)}</strong></span>`;
      detailsEl.innerHTML = details;
    } else {
      // Fallback ke harga internasional XAU/IDR
      const res3 = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json');
      const data3 = await res3.json();
      const xauIdr = data3.xau?.idr;
      if (xauIdr) {
        // XAU biasanya per troy ounce (~31.1 gram)
        const perGram = xauIdr / 31.1035;
        priceEl.textContent = formatIDR(perGram);
        metaEl.textContent = 'Harga spot internasional (per gram)';
        detailsEl.innerHTML = `<span>XAU/IDR: ${formatIDR(xauIdr)} / oz</span>`;
      } else {
        throw new Error('Tidak ada data emas');
      }
    }
  } catch (err) {
    console.error('Gold error:', err);
    priceEl.textContent = 'Gagal memuat';
    metaEl.textContent = 'Coba refresh atau cek koneksi';
    detailsEl.innerHTML = '';
  } finally {
    setLoading(priceEl, false);
  }
}

// ===== Fetch Saham (via Yahoo Finance chart endpoint - CORS mungkin terbatas) =====
async function fetchStocks() {
  const tbody = document.getElementById('stocksBody');
  tbody.innerHTML = '<tr><td colspan="4" class="loading">Memuat data saham...</td></tr>';

  const rows = [];

  for (const stock of STOCKS) {
    try {
      // Yahoo Finance unofficial chart endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stock.code}?interval=1d&range=1d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;

      if (meta) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || meta.previousClose;
        const change = price - prev;
        const changePct = prev ? (change / prev) * 100 : 0;
        const changeClass = change >= 0 ? 'change-up' : 'change-down';
        const sign = change >= 0 ? '+' : '';

        rows.push(`
          <tr>
            <td><strong>${stock.code.replace('.JK', '')}</strong></td>
            <td>${stock.name}</td>
            <td>${formatNumber(price, 0)}</td>
            <td class="${changeClass}">${sign}${formatNumber(change, 0)} (${sign}${formatNumber(changePct, 2)}%)</td>
          </tr>
        `);
      } else {
        rows.push(`
          <tr>
            <td><strong>${stock.code.replace('.JK', '')}</strong></td>
            <td>${stock.name}</td>
            <td colspan="2">Data tidak tersedia</td>
          </tr>
        `);
      }
    } catch (err) {
      console.warn(`Gagal load ${stock.code}:`, err.message);
      rows.push(`
        <tr>
          <td><strong>${stock.code.replace('.JK', '')}</strong></td>
          <td>${stock.name}</td>
          <td colspan="2">Gagal memuat (CORS/rate limit)</td>
        </tr>
      `);
    }
  }

  tbody.innerHTML = rows.join('') || '<tr><td colspan="4">Tidak ada data</td></tr>';
}

// ===== Main =====
async function loadAll() {
  document.getElementById('lastUpdate').textContent = 'Memperbarui data...';
  document.getElementById('refreshBtn').disabled = true;

  await Promise.all([fetchUSD(), fetchGold(), fetchStocks()]);

  const now = new Date();
  document.getElementById('lastUpdate').textContent =
    `Terakhir diperbarui: ${now.toLocaleString('id-ID')}`;
  document.getElementById('refreshBtn').disabled = false;
}

document.getElementById('refreshBtn').addEventListener('click', loadAll);

// Auto load on start
loadAll();

// Auto refresh every 5 minutes
setInterval(loadAll, 5 * 60 * 1000);
