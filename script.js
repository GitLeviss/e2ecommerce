// Variáveis globais
let users = [];
let products = [];
let categories = [];
let currentPage = 1;
let itemsPerPage = 9;
let selectedProductId = null;
let sessionTimer = null;
let confirmCallback = null;
let isLoggedIn = true; // Controla o estado de login

// Elementos do DOM
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.sidebar .nav-link');
const userModal = new bootstrap.Modal(document.getElementById('userModal'));
const stockModal = new bootstrap.Modal(document.getElementById('stockModal'));
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const notificationToast = new bootstrap.Toast(document.getElementById('notificationToast'));

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    checkLoginStatus();
    
    // Se estiver logado, carregar os dados
    if (isLoggedIn) {
        // Carregar usuários do localStorage
        loadUsersFromStorage();
        
        // Carregar produtos da API
        fetchProducts();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Iniciar timer de sessão
        startSessionTimer();
        
        // Exibir dashboard
        showPage('dashboard');
        updateDashboard();
    }
});

// Função para verificar status de login
function checkLoginStatus() {
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'false' || !loginStatus) {
        isLoggedIn = false;
        showLoginPage();
    } else {
        isLoggedIn = true;
    }
}

// Função para mostrar página de login
function showLoginPage() {
    // Esconder todas as páginas
    pages.forEach(page => {
        page.classList.add('d-none');
    });
    
    // Criar página de login se não existir
    if (!document.getElementById('login-page')) {
        const loginPage = document.createElement('div');
        loginPage.id = 'login-page';
        loginPage.className = 'page';
        loginPage.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="text-center">Login</h4>
                        </div>
                        <div class="card-body">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label for="loginEmail" class="form-label">E-mail</label>
                                    <input type="email" class="form-control" id="loginEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label">Senha</label>
                                    <input type="password" class="form-control" id="loginPassword" required>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary">Entrar</button>
                                </div>
                            </form>
                            <div class="text-center mt-3">
                                <small class="text-secondary">Use admin@sistema.com / Admin@1234 para entrar</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.content-area').appendChild(loginPage);
        
        // Adicionar event listener ao formulário de login
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    
    // Mostrar página de login
    document.getElementById('login-page').classList.remove('d-none');
}

// Função para lidar com login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Verificar credenciais (simulação)
    if (email === 'admin@sistema.com' && password === 'Admin@1234') {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        
        // Esconder página de login
        document.getElementById('login-page').classList.add('d-none');
        
        // Inicializar a aplicação
        loadUsersFromStorage();
        fetchProducts();
        setupEventListeners();
        startSessionTimer();
        showPage('dashboard');
        updateDashboard();
        
        showNotification('Login realizado com sucesso!', 'success');
    } else {
        showNotification('E-mail ou senha incorretos. Tente novamente.', 'danger');
    }
}

// Função para carregar usuários do localStorage
function loadUsersFromStorage() {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        // Usuários iniciais para demonstração
        users = [
            {
                id: 1,
                name: 'Administrador',
                email: 'admin@sistema.com',
                password: 'Admin@1234',
                profile: 'admin'
            },
            {
                id: 2,
                name: 'Vendedor Exemplo',
                email: 'vendedor@sistema.com',
                password: 'Vendedor@123',
                profile: 'seller'
            },
            {
                id: 3,
                name: 'Cliente Exemplo',
                email: 'cliente@sistema.com',
                password: 'Cliente@123',
                profile: 'customer'
            }
        ];
        saveUsersToStorage();
    }
}

// Função para salvar usuários no localStorage
function saveUsersToStorage() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Função para buscar produtos da API
async function fetchProducts() {
    try {
        console.log('Buscando produtos da API...');
        const response = await fetch('https://catalogo-products.pages.dev/api/products', {
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Falha ao buscar produtos: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Resposta da API:', data);
        
        // Verificar diferentes formatos de resposta possíveis
        if (data && data.products && Array.isArray(data.products)) {
            // Formato: { meta: {...}, products: [...] }
            products = data.products;
        } else if (Array.isArray(data)) {
            // Formato: array direto de produtos
            products = data;
        } else if (data && data.data && Array.isArray(data.data)) {
            // Formato: { data: [...] }
            products = data.data;
        } else {
            throw new Error('Formato de resposta inválido');
        }
        
        // Extrair categorias únicas
        const uniqueCategories = [...new Set(products.map(product => product.category).filter(Boolean))];
        categories = uniqueCategories;
        
        // Preencher filtro de categorias
        populateCategoryFilter();
        
        // Atualizar dashboard
        updateDashboard();
        
        // Renderizar produtos se estiver na página correta
        if (document.getElementById('products-page') && !document.getElementById('products-page').classList.contains('d-none')) {
            renderProducts();
        }
        
        console.log(`Carregados ${products.length} produtos e ${categories.length} categorias`);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos: ' + error.message, 'danger');
    }
}

// Função para preencher o filtro de categorias
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmModal('Tem certeza que deseja sair do sistema?', () => {
            performLogout();
        });
    });
    
    // Formulário de usuário
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    
    // Filtros de produtos
    document.getElementById('searchProduct').addEventListener('input', debounce(() => {
        currentPage = 1;
        renderProducts();
    }, 500));
    
    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        renderProducts();
    });
    
    document.getElementById('sortBy').addEventListener('change', () => {
        currentPage = 1;
        renderProducts();
    });
    
    // Modal de estoque
    document.getElementById('addStockBtn').addEventListener('click', handleAddStock);
    
    // Modal de confirmação
    document.getElementById('confirmActionBtn').addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        confirmModal.hide();
    });
    
    // Resetar timer de sessão em qualquer atividade
    document.addEventListener('click', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);
}

// Função para realizar logout
function performLogout() {
    // Limpar dados de sessão
    localStorage.setItem('isLoggedIn', 'false');
    isLoggedIn = false;
    
    // Limpar timer de sessão
    if (sessionTimer) {
        clearTimeout(sessionTimer);
    }
    
    // Mostrar notificação
    showNotification('Sessão encerrada. Redirecionando para o login...', 'success');
    
    // Redirecionar para página de login após um pequeno delay
    setTimeout(() => {
        showLoginPage();
    }, 1500);
}

// Função para exibir uma página
function showPage(pageName) {
    // Esconder todas as páginas
    pages.forEach(page => {
        page.classList.add('d-none');
    });
    
    // Remover classe ativa de todos os links
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Exibir a página selecionada
    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) {
        selectedPage.classList.remove('d-none');
    }
    
    // Adicionar classe ativa ao link correspondente
    const activeLink = document.querySelector(`.sidebar .nav-link[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Ações específicas por página
    if (pageName === 'users') {
        renderUsers();
    } else if (pageName === 'products') {
        renderProducts();
    } else if (pageName === 'dashboard') {
        updateDashboard();
    }
}

// Função para renderizar usuários
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name || 'Nome não informado'}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-${user.profile === 'admin' ? 'danger' : user.profile === 'seller' ? 'primary' : 'info'}">${user.profile === 'admin' ? 'Administrador' : user.profile === 'seller' ? 'Vendedor' : 'Cliente'}</span></td>
            <td><span class="badge bg-success">Ativo</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${user.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteUser(${user.id})"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para renderizar produtos
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Aplicar filtros
    const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    
    let filteredProducts = [...products];
    
    // Filtrar por termo de busca
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.title && product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar por categoria
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === categoryFilter
        );
    }
    
    // Ordenar
    filteredProducts.sort((a, b) => {
        if (sortBy === 'name') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (sortBy === 'price') {
            return (a.price?.final || 0) - (b.price?.final || 0);
        } else if (sortBy === 'stock') {
            return (a.stock?.quantity || 0) - (b.stock?.quantity || 0);
        }
        return 0;
    });
    
    // Paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Renderizar produtos
    if (paginatedProducts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>Nenhum produto encontrado.</p></div>';
    } else {
        paginatedProducts.forEach(product => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            col.innerHTML = `
                <div class="card product-card">
                    <img src="https://picsum.photos/seed/${product.id || 'product'}/400/300.jpg" class="card-img-top" alt="${product.title || 'Produto'}">
                    <div class="card-body">
                        <h5 class="card-title">${product.title || 'Sem nome'}</h5>
                        <p class="card-text">${product.description || 'Sem descrição disponível.'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-primary">${product.category || 'Sem categoria'}</span>
                            <span class="fw-bold">R$ ${(product.price?.final || 0).toFixed(2)}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span>Estoque: <strong>${product.stock?.quantity || 0}</strong></span>
                            <button class="btn btn-sm btn-primary" onclick="openStockModal('${product.id || ''}', '${product.title || 'Produto'}', ${product.stock?.quantity || 0})">
                                <i class="bi bi-plus-circle me-1"></i>Adicionar Estoque
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    }
    
    // Atualizar paginação
    updatePagination(filteredProducts.length);
}

// Função para atualizar a paginação
function updatePagination(totalItems) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Botão Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>`;
    pagination.appendChild(prevLi);
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
    
    // Botão Próximo
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Próximo</a>`;
    pagination.appendChild(nextLi);
}

// Função para mudar página
function changePage(page) {
    currentPage = page;
    renderProducts();
}

// Função para atualizar o dashboard
function updateDashboard() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalProducts').textContent = products.length;
    
    // Calcular produtos com estoque baixo (menos de 10 unidades)
    const lowStockCount = products.filter(product => (product.stock?.quantity || 0) < 10).length;
    document.getElementById('lowStock').textContent = lowStockCount;
}

// Função para salvar usuário
function saveUser() {
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const profile = document.getElementById('userProfile').value;
    
    // Validar campos obrigatórios
    if (!name || !email || !password || !profile) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'danger');
        return;
    }
    
    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, insira um e-mail válido.', 'danger');
        return;
    }
    
    // Validar senha
    if (!validatePassword(password)) {
        showNotification('A senha deve ter no mínimo 10 caracteres, incluindo números, letras e caracteres especiais.', 'danger');
        return;
    }
    
    // Verificar se o e-mail já existe (exceto para o usuário atual)
    if (users.some(user => user.email === email && user.id !== userId)) {
        showNotification('Este e-mail já está cadastrado no sistema.', 'danger');
        return;
    }
    
    if (userId) {
        // Atualizar usuário existente
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                name,
                email,
                profile,
                password: hashPassword(password)
            };
            showNotification('Usuário atualizado com sucesso!', 'success');
        }
    } else {
        // Criar novo usuário
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name,
            email,
            profile,
            password: hashPassword(password)
        };
        users.push(newUser);
        showNotification('Usuário cadastrado com sucesso!', 'success');
    }
    
    // Salvar no localStorage
    saveUsersToStorage();
    
    // Fechar modal e resetar formulário
    userModal.hide();
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    // Atualizar lista de usuários
    renderUsers();
    
    // Atualizar dashboard
    updateDashboard();
}

// Função para validar senha
function validatePassword(password) {
    // Mínimo 10 caracteres
    if (password.length < 10) return false;
    
    // Deve conter números
    if (!/\d/.test(password)) return false;
    
    // Deve conter letras
    if (!/[a-zA-Z]/.test(password)) return false;
    
    // Deve conter caracteres especiais
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    
    return true;
}

// Função para "criptografar" a senha (apenas para demonstração)
function hashPassword(password) {
    // Em um ambiente real, usaríamos um algoritmo de hash seguro como bcrypt
    return btoa(password); // Apenas para demonstração, não é seguro!
}

// Função para editar usuário
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Editar Usuário';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userProfile').value = user.profile || '';
    document.getElementById('userPassword').value = '';
    
    userModal.show();
}

// Função para confirmar exclusão de usuário
function confirmDeleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    showConfirmModal(`Tem certeza que deseja excluir o usuário "${user.name || 'Usuário'}"?`, () => {
        deleteUser(userId);
    });
}

// Função para excluir usuário
function deleteUser(userId) {
    users = users.filter(u => u.id !== userId);
    saveUsersToStorage();
    renderUsers();
    showNotification('Usuário excluído com sucesso!', 'success');
    updateDashboard();
}

// Função para abrir modal de estoque
function openStockModal(productId, productName, currentStock) {
    selectedProductId = productId;
    document.getElementById('stockProductName').textContent = productName;
    document.getElementById('stockCurrentStock').textContent = currentStock;
    document.getElementById('stockAmount').value = '10';
    document.getElementById('stockAlert').classList.add('d-none');
    
    stockModal.show();
}

// Função para lidar com adição de estoque
function handleAddStock() {
    if (!selectedProductId) return;
    
    const increaseAmount = parseInt(document.getElementById('stockAmount').value);
    const currentStock = parseInt(document.getElementById('stockCurrentStock').textContent);
    
    // Validar se é múltiplo de 10
    if (increaseAmount % 10 !== 0) {
        document.getElementById('stockMessage').textContent = 'O acréscimo deve ser em lotes de 10 (10, 20, 30...).';
        document.getElementById('stockAlert').classList.remove('d-none');
        return;
    }
    
    // Confirmar ação
    showConfirmModal(`Adicionar +${increaseAmount} unidades ao estoque do produto?`, () => {
        // Simular atualização de estoque (já que a API real pode não permitir)
        simulateStockUpdate(selectedProductId, increaseAmount, currentStock);
    });
}

// Função para simular atualização de estoque (para evitar CORS)
function simulateStockUpdate(productId, amount, currentStock) {
    try {
        const newStock = currentStock + amount;
        
        // Atualizar produto localmente
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            if (!products[productIndex].stock) {
                products[productIndex].stock = {};
            }
            products[productIndex].stock.quantity = newStock;
        }
        
        // Fechar modal
        stockModal.hide();
        
        // Atualizar interface
        renderProducts();
        
        // Mostrar notificação
        showNotification(`Estoque atualizado com sucesso! Novo estoque: ${newStock} unidades.`, 'success');
        
        // Atualizar dashboard
        updateDashboard();
        
        console.log(`Estoque do produto ${productId} atualizado de ${currentStock} para ${newStock}`);
    } catch (error) {
        showNotification('Falha ao atualizar estoque. Tente novamente.', 'danger');
        console.error('Erro ao atualizar estoque:', error);
    }
}

// Função para mostrar modal de confirmação
function showConfirmModal(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    confirmModal.show();
}

// Função para mostrar notificação
function showNotification(message, type) {
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    const toastElement = document.getElementById('notificationToast');
    
    if (titleElement) titleElement.textContent = type === 'success' ? 'Sucesso' : 'Erro';
    if (messageElement) messageElement.textContent = message;
    
    if (toastElement) {
        toastElement.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
        notificationToast.show();
    }
}

// Função para debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Funções para gerenciamento de sessão
function startSessionTimer() {
    // Encerrar sessão após 30 minutos de inatividade
    sessionTimer = setTimeout(() => {
        showNotification('Sua sessão expirou por inatividade.', 'warning');
        setTimeout(() => {
            performLogout();
        }, 3000);
    }, 30 * 60 * 1000); // 30 minutos
}

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    startSessionTimer();
}
