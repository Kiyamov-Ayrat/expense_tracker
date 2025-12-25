const { useState, useEffect } = React;

const API_BASE = 'http://localhost:8000';

const categoryMapping = {
  product: 'Продукты',
  transport: 'Транспорт',
  cafe: 'Кафе',
  internet: 'Интернет',
  clothes: 'Одежда',
  education: 'Образование',
  home: 'Дом',
  tax: 'Налоги',
  other: 'Прочее'
};

const categoryOptions = Object.entries(categoryMapping).map(([value, label]) => ({ value, label }));

function FinanceTracker() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [loading, setLoading] = useState(false);

  // Форма расхода
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'product'
  });

  // Дата расхода — по умолчанию сегодня
  const today = new Date();
  const [expenseDate, setExpenseDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate()
  });

  const [newBudget, setNewBudget] = useState({ amount: 0 });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });

  // State для бюджета - расширенный
  const [budgetPeriod, setBudgetPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1
  });

  // НОВЫЙ STATE: для просмотра бюджета на разные периоды
  const [budgetViewMode, setBudgetViewMode] = useState('current'); // 'current', 'range', 'year', 'custom'
  const [budgetRange, setBudgetRange] = useState({
    startYear: today.getFullYear(),
    startMonth: today.getMonth() + 1,
    endYear: today.getFullYear(),
    endMonth: today.getMonth() + 1
  });
  const [budgetYear, setBudgetYear] = useState(today.getFullYear());
  const [budgetCustomMonth, setBudgetCustomMonth] = useState(today.getMonth() + 1);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadBudget();
    loadStats();
    if (window.lucide) window.lucide.createIcons();
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const loadExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE}/expenses/?skip=0&limit=100`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error('Ошибка загрузки расходов');
    }
  };

  const loadBudget = async () => {
    const { year, month } = budgetPeriod;
    try {
      const res = await fetch(`${API_BASE}/budget/${year}/${month}`);
      if (res.ok) {
        const data = await res.json();
        setBudget(data);
      } else {
        setBudget(null);
      }
    } catch (err) {
      setBudget(null);
    }
  };

  // НОВАЯ ФУНКЦИЯ: Загрузка истории бюджета за период
  const loadBudgetHistory = async () => {
    setIsLoadingBudget(true);
    try {
      let url = '';

      if (budgetViewMode === 'range') {
        // Загрузка бюджета за диапазон месяцев
        url = `${API_BASE}/budget/range/${budgetRange.startYear}/${budgetRange.startMonth}/${budgetRange.endYear}/${budgetRange.endMonth}`;
      } else if (budgetViewMode === 'year') {
        // Загрузка бюджета за весь год
        url = `${API_BASE}/budget/year/${budgetYear}`;
      } else if (budgetViewMode === 'custom') {
        // Загрузка бюджета за конкретный месяц
        url = `${API_BASE}/budget/${budgetYear}/${budgetCustomMonth}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setBudgetHistory([{
            year: budgetYear,
            month: budgetCustomMonth,
            budget: data
          }]);
          calculateBudgetSummary([data]);
        }
        setIsLoadingBudget(false);
        return;
      } else {
        // Текущий месяц (по умолчанию)
        url = `${API_BASE}/budget/${budgetPeriod.year}/${budgetPeriod.month}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setBudget(data);
        }
        setIsLoadingBudget(false);
        return;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBudgetHistory(data.budgets || []);
        setBudgetSummary(data.summary || null);
      } else {
        setBudgetHistory([]);
        setBudgetSummary(null);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории бюджета:', err);
      setBudgetHistory([]);
      setBudgetSummary(null);
    } finally {
      setIsLoadingBudget(false);
    }
  };

  const loadStats = async () => {
    const { year, month } = filterDate;
    try {
      const res = await fetch(`${API_BASE}/filter/statistic/${year}/${month}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Ошибка статистики');
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) return alert('Заполните поля');
    setLoading(true);
    try {
      const isoDate = `${expenseDate.year}-${String(expenseDate.month).padStart(2, '0')}-${String(expenseDate.day).padStart(2, '0')}`;
      const payload = { ...newExpense, date: isoDate };

      const res = await fetch(`${API_BASE}/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewExpense({ description: '', amount: 0, category: 'product' });
        await loadExpenses();
        await loadStats();
        await loadBudget();
      }
    } catch (err) {
      alert('Ошибка добавления');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!confirm('Удалить?')) return;
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    await loadExpenses();
    await loadStats();
    await loadBudget();
  };

  const createBudget = async () => {
    if (newBudget.amount <= 0) return alert('Введите сумму');
    setLoading(true);
    try {
      const payload = {
        limit_amount: newBudget.amount,
        year: budgetPeriod.year,
        month: budgetPeriod.month
      };
      const res = await fetch(`${API_BASE}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewBudget({ amount: 0 });
        await loadBudget();
        // Если мы находимся в режиме просмотра истории, обновляем её
        if (budgetViewMode !== 'current') {
          await loadBudgetHistory();
        }
      }
    } catch (err) {
      alert('Ошибка бюджета');
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async () => {
    if (!filterCategory) return loadExpenses();
    const res = await fetch(`${API_BASE}/filter/${filterCategory}`);
    if (res.ok) setExpenses(await res.json());
  };

  const filterByMonth = async () => {
    const { year, month } = filterDate;
    const res = await fetch(`${API_BASE}/filter/${year}/${month}`);
    if (res.ok) setExpenses(await res.json());
    await loadStats();
    await loadBudget();
  };

  // НОВАЯ ФУНКЦИЯ: Фильтрация по категории и дате одновременно
  const filterByCategoryAndDate = async () => {
    if (!filterCategory) {
      // Если категория не выбрана, фильтруем только по дате
      return filterByMonth();
    }

    const { year, month } = filterDate;

    try {
      // Сначала получаем расходы по дате
      const dateRes = await fetch(`${API_BASE}/filter/${year}/${month}`);
      if (!dateRes.ok) throw new Error('Ошибка фильтрации по дате');

      const dateFiltered = await dateRes.json();

      // Затем фильтруем по категории на клиенте
      const filtered = dateFiltered.filter(expense =>
        expense.category === filterCategory
      );

      setExpenses(filtered);
      await loadStats(); // Обновляем статистику
      await loadBudget(); // Обновляем бюджет
    } catch (err) {
      console.error('Ошибка фильтрации:', err);
      alert('Ошибка при фильтрации');
    }
  };

  const downloadCSV = async () => {
    const { year, month } = filterDate;
    const res = await fetch(`${API_BASE}/filter/csv_statistic/${year}/${month}`);
    if (!res.ok) return alert('Ошибка CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${year}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetExpenseDate = () => {
    const t = new Date();
    setExpenseDate({ year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() });
  };

  // НОВАЯ ФУНКЦИЯ: Расчет сводки по бюджету
  const calculateBudgetSummary = (budgets) => {
    if (!budgets || budgets.length === 0) {
      setBudgetSummary(null);
      return;
    }

    const summary = {
      totalBudget: 0,
      totalSpent: 0,
      totalBalance: 0,
      averageBudget: 0,
      averageSpent: 0,
      monthsCount: budgets.length,
      overLimitMonths: 0
    };

    budgets.forEach(budget => {
      if (budget && budget.planed_budget) {
        summary.totalBudget += budget.planed_budget;
        summary.totalSpent += budget.spent || 0;
        summary.totalBalance += budget.balance || 0;
        if (budget.is_over_limit) summary.overLimitMonths++;
      }
    });

    summary.averageBudget = summary.totalBudget / summary.monthsCount;
    summary.averageSpent = summary.totalSpent / summary.monthsCount;

    setBudgetSummary(summary);
  };

  // НОВАЯ ФУНКЦИЯ: Получение названия месяца
  const getMonthName = (month) => {
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return monthNames[month - 1] || `Месяц ${month}`;
  };

  // НОВАЯ ФУНКЦИЯ: Переключение режима просмотра бюджета
  const switchBudgetView = (mode) => {
    setBudgetViewMode(mode);
    setTimeout(() => {
      if (mode === 'current') {
        loadBudget();
      } else {
        loadBudgetHistory();
      }
    }, 100);
  };

  // Загружаем историю бюджета при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'budget' && budgetViewMode !== 'current') {
      loadBudgetHistory();
    }
  }, [activeTab, budgetViewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <i data-lucide="wallet" className="w-8 h-8 text-indigo-600"></i>
            <h1 className="text-2xl font-bold text-slate-800">Finance Tracker</h1>
          </div>
          <div className="flex gap-2">
            {['expenses', 'budget', 'stats'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                {tab === 'expenses' ? 'Расходы' : tab === 'budget' ? 'Бюджет' : 'Статистика'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-slide-in">
            {/* Добавление расхода с датой */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <i data-lucide="plus-circle" className="w-6 h-6 text-indigo-600"></i>
                Добавить расход
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Описание"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Сумма"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {categoryOptions.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Дата расхода</label>
                    <div className="flex gap-2 items-end">
                      <input
                        type="number"
                        placeholder="Год"
                        value={expenseDate.year}
                        onChange={e => setExpenseDate({...expenseDate, year: parseInt(e.target.value) || today.getFullYear()})}
                        className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="Месяц"
                        value={expenseDate.month}
                        onChange={e => setExpenseDate({...expenseDate, month: parseInt(e.target.value) || today.getMonth() + 1})}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="День"
                        value={expenseDate.day}
                        onChange={e => setExpenseDate({...expenseDate, day: parseInt(e.target.value) || today.getDate()})}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={resetExpenseDate}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                      >
                        Сегодня
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={addExpense}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? <span className="spinner"></span> : 'Добавить расход'}
                  </button>
                </div>
              </div>
            </div>

            {/* Фильтры */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <i data-lucide="filter" className="w-5 h-5 text-indigo-600"></i>
                Фильтры
              </h3>
              <div className="flex gap-3 flex-wrap items-end">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Категория</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Все категории</option>
                    {categoryOptions.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Год</label>
                  <input
                    type="number"
                    placeholder="Год"
                    value={filterDate.year}
                    onChange={e => setFilterDate({...filterDate, year: parseInt(e.target.value)})}
                    className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Месяц</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Месяц"
                    value={filterDate.month}
                    onChange={e => setFilterDate({...filterDate, month: parseInt(e.target.value)})}
                    className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={filterByCategory}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2"
                  >
                    <i data-lucide="tag" className="w-4 h-4"></i>
                    Только категория
                  </button>

                  <button
                    onClick={filterByMonth}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2"
                  >
                    <i data-lucide="calendar" className="w-4 h-4"></i>
                    Только дата
                  </button>

                  {/* НОВАЯ КНОПКА: Фильтр по категории и дате */}
                  <button
                    onClick={filterByCategoryAndDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <i data-lucide="filter" className="w-4 h-4"></i>
                    Категория + дата
                  </button>

                  <button
                    onClick={loadExpenses}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                  >
                    <i data-lucide="refresh-cw" className="w-4 h-4"></i>
                    Сбросить
                  </button>
                </div>
              </div>

              {/* Подсказка */}
              <p className="text-sm text-slate-500 mt-3">
                Используйте "Категория + дата" для одновременной фильтрации по обоим параметрам
              </p>
            </div>

            {/* Список расходов с датой */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Список расходов ({expenses.length})</h3>
                {filterCategory && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    Категория: {categoryMapping[filterCategory] || filterCategory}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <div className="empty-state">
                    <p className="text-center text-slate-500 py-8">Расходов нет</p>
                  </div>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className="expense-card flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-500">
                            {new Date(exp.date).toLocaleDateString('ru-RU')}
                          </span>
                          <h4 className="font-medium text-slate-800">{exp.description}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            exp.category === 'product' ? 'bg-green-100 text-green-800' :
                            exp.category === 'transport' ? 'bg-blue-100 text-blue-800' :
                            exp.category === 'cafe' ? 'bg-yellow-100 text-yellow-800' :
                            exp.category === 'internet' ? 'bg-purple-100 text-purple-800' :
                            exp.category === 'clothes' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {categoryMapping[exp.category] || exp.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-red-600">-{exp.amount} ₽</span>
                        <button onClick={() => deleteExpense(exp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <i data-lucide="trash-2" className="w-5 h-5"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Вкладка Бюджет - РАСШИРЕННАЯ ВЕРСИЯ */}
        {activeTab === 'budget' && (
          <div className="space-y-6 animate-slide-in">
            {/* Переключение режимов просмотра бюджета */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Режим просмотра бюджета</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => switchBudgetView('current')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${budgetViewMode === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <i data-lucide="calendar" className="w-4 h-4"></i>
                  Текущий месяц
                </button>
                <button
                  onClick={() => switchBudgetView('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${budgetViewMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <i data-lucide="calendar-days" className="w-4 h-4"></i>
                  Конкретный месяц
                </button>
                <button
                  onClick={() => switchBudgetView('range')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${budgetViewMode === 'range' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <i data-lucide="calendar-range" className="w-4 h-4"></i>
                  Диапазон месяцев
                </button>
                <button
                  onClick={() => switchBudgetView('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${budgetViewMode === 'year' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  <i data-lucide="calendar" className="w-4 h-4"></i>
                  Весь год
                </button>
              </div>

              {/* Формы для разных режимов просмотра */}
              {budgetViewMode === 'current' && (
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                    <input
                      type="number"
                      value={budgetPeriod.year}
                      onChange={(e) => {
                        const y = parseInt(e.target.value) || new Date().getFullYear();
                        setBudgetPeriod({...budgetPeriod, year: y});
                        setTimeout(loadBudget, 300);
                      }}
                      className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={budgetPeriod.month}
                      onChange={(e) => {
                        const m = parseInt(e.target.value) || new Date().getMonth() + 1;
                        setBudgetPeriod({...budgetPeriod, month: m});
                        setTimeout(loadBudget, 300);
                      }}
                      className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setBudgetPeriod({ year: now.getFullYear(), month: now.getMonth() + 1 });
                      setTimeout(loadBudget, 300);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Текущий месяц
                  </button>
                </div>
              )}

              {budgetViewMode === 'custom' && (
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                    <input
                      type="number"
                      value={budgetYear}
                      onChange={(e) => setBudgetYear(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={budgetCustomMonth}
                      onChange={(e) => setBudgetCustomMonth(parseInt(e.target.value) || new Date().getMonth() + 1)}
                      className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={loadBudgetHistory}
                    disabled={isLoadingBudget}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoadingBudget ? 'Загрузка...' : 'Показать'}
                  </button>
                </div>
              )}

              {budgetViewMode === 'range' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Начало периода</h4>
                      <div className="flex gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Год</label>
                          <input
                            type="number"
                            value={budgetRange.startYear}
                            onChange={(e) => setBudgetRange({...budgetRange, startYear: parseInt(e.target.value) || new Date().getFullYear()})}
                            className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Месяц</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={budgetRange.startMonth}
                            onChange={(e) => setBudgetRange({...budgetRange, startMonth: parseInt(e.target.value) || new Date().getMonth() + 1})}
                            className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Конец периода</h4>
                      <div className="flex gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Год</label>
                          <input
                            type="number"
                            value={budgetRange.endYear}
                            onChange={(e) => setBudgetRange({...budgetRange, endYear: parseInt(e.target.value) || new Date().getFullYear()})}
                            className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Месяц</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={budgetRange.endMonth}
                            onChange={(e) => setBudgetRange({...budgetRange, endMonth: parseInt(e.target.value) || new Date().getMonth() + 1})}
                            className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={loadBudgetHistory}
                    disabled={isLoadingBudget}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoadingBudget ? 'Загрузка...' : 'Показать бюджет за период'}
                  </button>
                </div>
              )}

              {budgetViewMode === 'year' && (
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                    <input
                      type="number"
                      value={budgetYear}
                      onChange={(e) => setBudgetYear(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={loadBudgetHistory}
                    disabled={isLoadingBudget}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoadingBudget ? 'Загрузка...' : 'Показать годовой бюджет'}
                  </button>
                </div>
              )}
            </div>

            {/* Установка бюджета (только для текущего месяца) */}
            {budgetViewMode === 'current' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Установить бюджет на выбранный период</h2>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Сумма бюджета"
                    value={newBudget.amount || ''}
                    onChange={(e) => setNewBudget({amount: parseFloat(e.target.value) || 0})}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={createBudget} disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? <span className="spinner"></span> : 'Установить'}
                  </button>
                </div>
              </div>
            )}

            {/* Отображение бюджета в зависимости от режима */}
            {budgetViewMode === 'current' && budget ? (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">
                  Бюджет на {budgetPeriod.month}/{budgetPeriod.year}
                </h3>
                <p className="text-4xl font-bold mb-4">{budget.planed_budget?.toLocaleString() || 0} ₽</p>
                <p className="text-xl mb-2">Потрачено: {budget.spent?.toLocaleString() || 0} ₽</p>
                <p className={`text-2xl font-bold ${budget.balance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  Остаток: {budget.balance?.toLocaleString() || 0} ₽
                </p>
                {budget.is_over_limit && (
                  <p className="text-red-200 text-lg mt-4 font-semibold">⚠️ Бюджет превышен!</p>
                )}
              </div>
            ) : budgetViewMode === 'current' && (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-slate-500 text-lg">Бюджет на этот период не установлен</p>
              </div>
            )}

            {/* Отображение истории бюджета */}
            {(budgetViewMode === 'range' || budgetViewMode === 'year' || budgetViewMode === 'custom') && (
              <>
                {isLoadingBudget ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-slate-500">Загрузка данных о бюджете...</p>
                  </div>
                ) : budgetHistory && budgetHistory.length > 0 ? (
                  <>
                    {/* Сводка по периоду */}
                    {budgetSummary && (
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">Сводка за период</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm opacity-90">Всего месяцев</p>
                            <p className="text-2xl font-bold">{budgetSummary.monthsCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm opacity-90">Общий бюджет</p>
                            <p className="text-2xl font-bold">{budgetSummary.totalBudget?.toLocaleString() || 0} ₽</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm opacity-90">Потрачено</p>
                            <p className="text-2xl font-bold">{budgetSummary.totalSpent?.toLocaleString() || 0} ₽</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm opacity-90">Баланс</p>
                            <p className={`text-2xl font-bold ${budgetSummary.totalBalance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {budgetSummary.totalBalance?.toLocaleString() || 0} ₽
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 text-sm">
                          <p>Среднемесячный бюджет: {Math.round(budgetSummary.averageBudget)?.toLocaleString() || 0} ₽</p>
                          <p>Среднемесячные траты: {Math.round(budgetSummary.averageSpent)?.toLocaleString() || 0} ₽</p>
                          <p>Месяцев с превышением: {budgetSummary.overLimitMonths}</p>
                        </div>
                      </div>
                    )}

                    {/* Детальная история по месяцам */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Детали по месяцам</h3>
                      <div className="space-y-3">
                        {budgetHistory.map((item, index) => (
                          <div key={index} className={`p-4 rounded-lg ${item.budget?.is_over_limit ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-slate-800">
                                {getMonthName(item.month)} {item.year}
                              </h4>
                              {item.budget?.is_over_limit && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                  Превышен
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-slate-500">Бюджет</p>
                                <p className="font-semibold">{item.budget?.planed_budget?.toLocaleString() || 0} ₽</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Потрачено</p>
                                <p className="font-semibold text-red-600">{item.budget?.spent?.toLocaleString() || 0} ₽</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Остаток</p>
                                <p className={`font-semibold ${(item.budget?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.budget?.balance?.toLocaleString() || 0} ₽
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-slate-500">Нет данных о бюджете за выбранный период</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Вкладка Статистика */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex gap-3 flex-wrap mb-4">
              <input
                type="number"
                placeholder="Год"
                value={filterDate.year}
                onChange={(e) => setFilterDate({...filterDate, year: parseInt(e.target.value)})}
                className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Месяц"
                min="1"
                max="12"
                value={filterDate.month}
                onChange={(e) => setFilterDate({...filterDate, month: parseInt(e.target.value)})}
                className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={loadStats} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Обновить
              </button>
              <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <i data-lucide="download" className="w-5 h-5"></i>
                Скачать CSV
              </button>
            </div>

            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Общая статистика</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Всего расходов:</span>
                      <span className="text-2xl font-bold text-red-600">{stats.spent || 0} ₽</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">По категориям</h3>
                  <div className="space-y-2">
                    {stats.by_category && Object.entries(stats.by_category).map(([cat, amount]) => (
                      <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-slate-700">{categoryMapping[cat] || cat}</span>
                        <span className="font-semibold text-slate-800">{amount} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 empty-state">
                <p className="text-slate-500">Загрузите статистику</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FinanceTracker />);