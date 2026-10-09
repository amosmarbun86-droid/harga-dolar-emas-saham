// ===== Konfigurasi =====
const STOCKS = [
  { code: 'BBCA', name: 'Bank Central Asia' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia' },
  { code: 'BMRI', name: 'Bank Mandiri' },
  { code: 'TLKM', name: 'Telkom Indonesia' },
  { code: 'ASII', name: 'Astra International' },
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia' },
];

const STORAGE_KEY = 'invezgo_api_key';

// ===== Helper =====
function formatIDR(num) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(num, decimals = 0) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

function setLoading(el, loading = true) {
  if (!el) return;
  if (loading) el.classList.add('loading');
  else el.classList.remove('loading');
}

function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function setApiKey(key) {
  if (key) localStorage.setItem(STORAGE_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY);
}

// ===== UI API Key =====
function initApiKeyUI() {
  const input = document.getElementById('apiKeyInput');
  const status = document.getElementById('keyStatus');
  const saved = getApiKey();

  if (saved) {
    input.value = saved;
    input.type = 'password';
    status.textContent = '✓ API Key tersimpan di browser';
    status.classList.remove('error');
  }

  document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const key = input.value.trim();
    if (!key) {
      status.textContent = 'API Key tidak boleh kosong';
      status.classList.add('error');
      return;
    }
    setApiKey(key);
    status.textContent = '✓ API Key berhasil disimpan';
    status.classList.remove('error');
    loadAll();
  });
}

// ===== Fetch USD/IDR =====
async function fetchUSD() {
  const priceEl = document.getElementById('usdPrice');
  const metaEl = document.getElementById('usdMeta');
  setLoading(priceEl, true);

  try {
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
    const res = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/anekalogam');
    const data = await res.json();

    let buy = null, sell = null, source = 'Aneka Logam';

    if (data?.data) {
      const d = data.data;
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
      const res3 = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json');
      const data3 = await res3.json();
      const xauIdr = data3.xau?.idr;
      if (xauIdr) {
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

// ===== Fetch Saham via Invezgo =====
async function fetchStocks() {
  const tbody = document.getElementById('stocksBody');
  const apiKey = getApiKey();

  if (!apiKey) {
    tbody.innerHTML = '<tr><td colspan="7">Masukkan & simpan API Key Invezgo terlebih dahulu</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="7" class="loading">Memuat data saham dari Invezgo...</td></tr>';

  const rows = [];

  // Coba batch dulu (lebih efisien)
  const codes = STOCKS.map(s => s.code).join('|');
  let batchOk = false;

  try {
    const batchUrl = `https://api.invezgo.com/batch/intraday-data/${codes}?market=RG`;
    const res = await fetch(batchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (res.status === 401) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171">API Key tidak valid (401). Periksa kembali key-nya.</td></tr>';
      return;
    }
    if (res.status === 402) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171">Paket tidak mencukupi (402). Upgrade paket Invezgo atau aktifkan trial.</td></tr>';
      return;
    }
    if (res.status === 429) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171">Rate limit (429). Tunggu sebentar lalu coba lagi.</td></tr>';
      return;
    }

    if (res.ok) {
      const data = await res.json();
      // Respons batch bisa berupa object keyed by code atau array
      const items = Array.isArray(data) ? data : (data?.data || data);

      if (items && (Array.isArray(items) || typeof items === 'object')) {
        for (const stock of STOCKS) {
          let item = null;
          if (Array.isArray(items)) {
            item = items.find(x => (x.code || x.symbol || '').toUpperCase() === stock.code);
          } else {
            item = items[stock.code] || items[stock.code.toLowerCase()];
          }

          if (item) {
            const price = item.close ?? item.last ?? item.price ?? item.c;
            const open = item.open ?? item.o;
            const high = item.high ?? item.h;
            const low = item.low ?? item.l;
            const volume = item.volume ?? item.vol ?? item.v;

            rows.push(`
              <tr>
                <td><strong>${stock.code}</strong></td>
                <td>${stock.name}</td>
                <td>${formatNumber(price)}</td>
                <td>${formatNumber(open)}</td>
                <td>${formatNumber(high)}</td>
                <td>${formatNumber(low)}</td>
                <td>${formatNumber(volume)}</td>
              </tr>
            `);
          } else {
            rows.push(`
              <tr>
                <td><strong>${stock.code}</strong></td>
                <td>${stock.name}</td>
                <td colspan="5">Tidak ada data</td>
              </tr>
            `);
          }
        }
        batchOk = rows.length > 0;
      }
    }
  } catch (err) {
    console.warn('Batch gagal, coba individual:', err.message);
  }

  // Fallback: request individual per saham
  if (!batchOk) {
    rows.length = 0;
    for (const stock of STOCKS) {
      try {
        const url = `https://api.invezgo.com/analysis/intraday-data/${stock.code}?market=RG`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        });

        if (res.status === 401) {
          tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171">API Key tidak valid (401).</td></tr>';
          return;
        }
        if (res.status === 402) {
          tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171">Paket tidak mencukupi (402).</td></tr>';
          return;
        }

        if (!res.ok) {
          rows.push(`
            <tr>
              <td><strong>${stock.code}</strong></td>
              <td>${stock.name}</td>
              <td colspan="5">Error ${res.status}</td>
            </tr>
          `);
          continue;
        }

        const data = await res.json();
        const item = data?.data || data;

        const price = item.close ?? item.last ?? item.price ?? item.c;
        const open = item.open ?? item.o;
        const high = item.high ?? item.h;
        const low = item.low ?? item.l;
        const volume = item.volume ?? item.vol ?? item.v;

        rows.push(`
          <tr>
            <td><strong>${stock.code}</strong></td>
            <td>${stock.name}</td>
            <td>${formatNumber(price)}</td>
            <td>${formatNumber(open)}</td>
            <td>${formatNumber(high)}</td>
            <td>${formatNumber(low)}</td>
            <td>${formatNumber(volume)}</td>
          </tr>
        `);
      } catch (err) {
        console.warn(`Gagal ${stock.code}:`, err.message);
        rows.push(`
          <tr>
            <td><strong>${stock.code}</strong></td>
            <td>${stock.name}</td>
            <td colspan="5">Gagal memuat</td>
          </tr>
        `);
      }
    }
  }

  tbody.innerHTML = rows.join('') || '<tr><td colspan="7">Tidak ada data</td></tr>';
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

// Init
initApiKeyUI();
loadAll();

// Auto refresh every 5 minutes
setInterval(loadAll, 5 * 60 * 1000);
