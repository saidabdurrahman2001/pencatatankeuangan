const STORAGE_KEY = "catatuang.transactions";

const form = document.querySelector("#transactionForm");
const nameInput = document.querySelector("#transactionName");
const amountInput = document.querySelector("#transactionAmount");
const typeInput = document.querySelector("#transactionType");
const categoryInput = document.querySelector("#transactionCategory");
const dateInput = document.querySelector("#transactionDate");
const filterInput = document.querySelector("#transactionFilter");
const transactionList = document.querySelector("#transactionList");
const emptyState = document.querySelector("#emptyState");
const balanceAmount = document.querySelector("#balanceAmount");
const incomeAmount = document.querySelector("#incomeAmount");
const expenseAmount = document.querySelector("#expenseAmount");
const transactionCount = document.querySelector("#transactionCount");

let transactions = loadTransactions();

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

dateInput.valueAsDate = new Date();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);

  if (!nameInput.value.trim() || amount <= 0) {
    return;
  }

  const transaction = {
    id: createTransactionId(),
    name: nameInput.value.trim(),
    amount,
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value,
  };

  transactions = [transaction, ...transactions];
  saveTransactions();
  render();
  form.reset();
  dateInput.valueAsDate = new Date();
  nameInput.focus();
});

filterInput.addEventListener("change", render);

transactionList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");

  if (!deleteButton) {
    return;
  }

  transactions = transactions.filter((transaction) => transaction.id !== deleteButton.dataset.deleteId);
  saveTransactions();
  render();
});

function render() {
  renderSummary();
  renderTransactions();
}

function renderSummary() {
  const totals = transactions.reduce(
    (summary, transaction) => {
      summary[transaction.type] += transaction.amount;
      return summary;
    },
    { income: 0, expense: 0 },
  );

  const balance = totals.income - totals.expense;

  balanceAmount.textContent = formatCurrency(balance);
  incomeAmount.textContent = formatCurrency(totals.income);
  expenseAmount.textContent = formatCurrency(totals.expense);
  transactionCount.textContent = transactions.length;
}

function renderTransactions() {
  const activeFilter = filterInput.value;
  const filteredTransactions = transactions.filter((transaction) => {
    return activeFilter === "all" || transaction.type === activeFilter;
  });

  transactionList.innerHTML = "";
  emptyState.classList.toggle("show", filteredTransactions.length === 0);

  const fragment = document.createDocumentFragment();

  filteredTransactions.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = "transaction-item";

    const signedAmount = transaction.type === "income" ? transaction.amount : -transaction.amount;
    const typeLabel = transaction.type === "income" ? "Pemasukan" : "Pengeluaran";

    item.innerHTML = `
      <div class="transaction-meta">
        <strong>${escapeHtml(transaction.name)}</strong>
        <span>${typeLabel} &bull; ${escapeHtml(transaction.category)}</span>
        <span class="transaction-date">${formatDate(transaction.date)}</span>
      </div>
      <span class="transaction-amount ${transaction.type}">${formatCurrency(signedAmount)}</span>
      <button class="delete-btn" type="button" data-delete-id="${transaction.id}">Hapus</button>
    `;

    fragment.appendChild(item);
  });

  transactionList.appendChild(fragment);
}

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function createTransactionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatDate(value) {
  if (!value) {
    return "Tanpa tanggal";
  }

  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}
