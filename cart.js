
const ORDER_EMAIL = 'hololobova.kateryna12@gmail.com';

const PRODUCTS = {
  'potato-onion':     { name: 'Класичні вареники з картоплею та смаженою цибулею', price: 289, img: 'images/potato-onion.jpg' },
  'potato-mushroom':  { name: 'Вареники з картоплею та білими грибами',            price: 319, img: 'images/potato-mushroom.jpg' },
  'veal-onion':       { name: 'Вареники з телятиною та карамелізованою цибулею',   price: 389, img: 'images/veal-onion.jpg' },
  'cheese-dill':      { name: 'Вареники з домашнім сиром та кропом',               price: 329, img: 'images/cheese-dill.jpg' },
  'cherry':           { name: 'Вареники з вишнею',                                 price: 339, img: 'images/cherry.jpg' },
  'cabbage-mushroom': { name: 'Вареники з тушкованою капустою та грибами',         price: 299, img: 'images/cabbage-mushroom.jpg' },
  'tasting-box':      { name: 'Дегустаційний набір «Sunflower Selection»',         price: 749, img: 'images/tasting-box.jpg' },
  'holubtsi':         { name: 'Голубці в томатно-вершковому соусі',                price: 429, img: 'images/holubtsi.jpg' },
};


const STORAGE_KEY = 'sg_cart';
const MAX_QTY = 20;

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    Object.keys(data).forEach(id => { if (!PRODUCTS[id]) delete data[id]; });
    return data;
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  updateCount(cart);
}

function setQty(id, qty) {
  const cart = loadCart();
  if (qty <= 0) delete cart[id];
  else cart[id] = Math.min(qty, MAX_QTY);
  saveCart(cart);
}

function cartTotals(cart) {
  let count = 0, sum = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    count += qty;
    sum += PRODUCTS[id].price * qty;
  });
  return { count, sum };
}

const formatPrice = n => '₴' + n.toLocaleString('uk-UA');

function updateCount(cart = loadCart()) {
  const { count } = cartTotals(cart);
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

function showToast(text) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `${text} <a href="cart.html">Перейти до кошика →</a>`;
  toast.classList.add('toast--show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('toast--show'), 3000);
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.add;
    if (!PRODUCTS[id]) return;
    setQty(id, (loadCart()[id] || 0) + 1);
    showToast('Додано до кошика.');
    btn.classList.add('btn--added');
    setTimeout(() => btn.classList.remove('btn--added'), 600);
  });
});

function renderCartPage() {
  const list = document.querySelector('[data-cart-list]');
  if (!list) return;

  const cart = loadCart();
  const ids = Object.keys(cart);
  document.querySelector('[data-cart-empty]').hidden = ids.length > 0;
  document.querySelector('[data-cart-layout]').hidden = ids.length === 0;
  if (ids.length === 0) return;

  list.innerHTML = ids.map(id => {
    const p = PRODUCTS[id];
    const qty = cart[id];
    return `
      <li class="cart-item">
        <div class="cart-item__img"><img src="${p.img}" alt=""></div>
        <div class="cart-item__info">
          <h3 class="cart-item__name">${p.name}</h3>
          <span class="cart-item__unit">${formatPrice(p.price)} / шт.</span>
        </div>
        <div class="qty">
          <button type="button" class="qty__btn" data-qty="${id}" data-delta="-1" aria-label="Менше">−</button>
          <span class="qty__value">${qty}</span>
          <button type="button" class="qty__btn" data-qty="${id}" data-delta="1" aria-label="Більше">+</button>
        </div>
        <span class="cart-item__total">${formatPrice(p.price * qty)}</span>
        <button type="button" class="cart-item__remove" data-remove="${id}" aria-label="Видалити">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </li>`;
  }).join('');

  const { count, sum } = cartTotals(cart);
  document.querySelector('[data-summary-count]').textContent = count;
  document.querySelector('[data-summary-total]').textContent = formatPrice(sum);
}

document.addEventListener('click', e => {
  const qtyBtn = e.target.closest('[data-qty]');
  if (qtyBtn) {
    const id = qtyBtn.dataset.qty;
    setQty(id, (loadCart()[id] || 0) + Number(qtyBtn.dataset.delta));
    renderCartPage();
  }
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    setQty(removeBtn.dataset.remove, 0);
    renderCartPage();
  }
});

const form = document.querySelector('[data-checkout]');
if (form) {
  form.action = 'https://formsubmit.co/' + ORDER_EMAIL;

  form.addEventListener('submit', e => {
    const cart = loadCart();
    if (Object.keys(cart).length === 0) {
      e.preventDefault();
      return;
    }
    const { sum } = cartTotals(cart);
    const lines = Object.entries(cart).map(([id, qty]) =>
      `${PRODUCTS[id].name} × ${qty} = ${formatPrice(PRODUCTS[id].price * qty)}`
    );

    form.elements['Замовлення'].value = lines.join('\n');
    form.elements['Сума'].value = formatPrice(sum);
    form.elements['_subject'].value =
      `Нове замовлення на ${formatPrice(sum)} — ${form.elements["Ім'я"].value}`;
    form.elements['_next'].value = new URL('success.html', location.href).href;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Надсилаємо…';
  });

  window.addEventListener('pageshow', () => {
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = false;
    btn.textContent = 'Оформити замовлення';
  });
}

if (document.querySelector('[data-clear-cart]')) saveCart({});

updateCount();
renderCartPage();
window.addEventListener('storage', () => { updateCount(); renderCartPage(); });
