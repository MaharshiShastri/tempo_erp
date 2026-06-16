import { useEffect, useState } from "react";
import { FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import useERPState from "./hooks/useERPState";

import LoginView from "./views/LoginView";
import OrdersListView from "./views/OrdersListView";
import OrderEntryFormView from "./views/OrderEntryFormView";
import BillsListView from "./views/BillsListView";
import BillEntryFormView from "./views/BillEntryFormView";
import CompaniesListView from "./views/CompaniesListView";
import CompanyEntryFormView from "./views/CompanyEntryFormView";
import TasksWorkspaceView from "./views/TasksWorkspaceView";
import AdminUserRegistryView from "./views/AdminUserRegistryView";
import DispatchPlannerView  from "./views/DispatchPlannerView";
import SharedAlertModal from "./components/shared/SharedAlertModal";
import {ToastContainer} from "./components/Shared";
import LogisticsPartnerEntryView from "./views/LogisticsPartnerEntryView";
import ItemMasterView from './views/ItemMasterView';
import ItemMasterCreateView from "./views/ItemMasterCreateView";
import ItemMasterDetailView from "./views/ItemMasterDetailView";
import ActivityDashboardView from "./views/ActivityDashboardView";
import PrintInvoiceTemplate from "./print/PrintInvoiceTemplate";
import PrintOrderTemplate from "./print/PrintOrderTemplate";

function App() {
    const state = useERPState();
    const [theme, setTheme] = useState(localStorage.getItem('erp-theme') || 'light');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('erp-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        const savedSession = localStorage.getItem("tempo_erp_user");
        if (savedSession) {
        try {
            state.setUser(JSON.parse(savedSession));
        } catch (e) {
            console.error("Corrupted session data");
            localStorage.removeItem("tempo_erp_user");
        }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("tempo_erp_user");
        state.setUser(null);
    };

    console.log("USER:", state.user);
    if (!state.user) return (<LoginView state={state} />);

    const pendingTasksCount = (state.tasks || []).filter(t => t.is_incomplete && t.direction === 'received').length;
    const isSuperUser = state.user.role === 'Chief Full Stack Developer' || state.user.role === 'Admin';
    const isFactory = state.user.department === 'Factory' || state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer';
    const isSales = state.user.department === 'Sales' || state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer';
    const isTransporter = state.user?.role === 'Dispatch Engineer' || state.user.role === 'Chief Full Stack Developer'|| state.user.role === 'Admin' ;
    return (
        <div className="frappe-layout">
            {state.printType === 'invoice' && <PrintInvoiceTemplate invoiceData={state.activePrintJob} />}
            {state.printType === 'order' && <PrintOrderTemplate orderData={state.activePrintJob} />}

            {/* FRAPPE SIDEBAR */}
            <aside className="frappe-sidebar" className={`frappe-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    {!sidebarCollapsed && <h2>Tempo ERP</h2>}
                    <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
    </button>
                </div>
                
                <div className="sidebar-menu">
                    <div className="menu-group">
                        <span className="menu-title">Sales Module</span>
                        <a href="#companies" className={`menu-item ${state.activeTab === 'companies-list' || state.activeTab === 'company-new' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); state.setActiveTab('companies-list')}}>
                            <span>👥</span>
                            {!sidebarCollapsed && (<span>Clients Directory</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+C</span>
                        </a>
                        <a href="#orders" className={`menu-item ${state.activeTab === 'orders-list' || state.activeTab === 'order-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('orders-list')}}>
                            <span>📦</span> 
                            {!sidebarCollapsed &&(<span>Orders Blueprints</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+O</span>
                        </a>
                        <a href="#billing" className={`menu-item ${state.activeTab === 'bills-list' || state.activeTab === 'bill-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('bills-list')}}>
                            <span>🧾</span> 
                            {!sidebarCollapsed &&(<span>Billing Ledgers</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+B</span>
                        </a>
                        <a href="#dispatch" className={`menu-item ${state.activeTab === 'dispatch-planner' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('dispatch-planner')}} >
                            <span>🚚</span> 
                            {!sidebarCollapsed &&(<span>Dispatch Planner</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+D</span>
                        </a>
                        <a href="#partner-new" className={`menu-item ${state.activeTab === 'partner-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('partner-new')}}>
                            <span>🤝</span>
                            {!sidebarCollapsed && (<span>Logistics Master</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+L</span>
                        </a>
                        <a href="#items" className={`menu-item ${state.activeTab === 'items-master' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('items-master')}}>
                            <span>📦</span> 
                            {!sidebarCollapsed && (<span>Product Master</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+I</span>
                        </a>
                    </div>
                    
                    <div className="menu-group">
                        <span className="menu-title">Shop Floor</span>
                        <a href="#tasks" className={`menu-item ${state.activeTab === 'tasks-workspace' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('tasks-workspace')}}>
                            <span>⚙️</span> 
                            {!sidebarCollapsed && (<span>Task Management </span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+T</span>
                            {pendingTasksCount > 0 && <span className="sidebar-badge">{pendingTasksCount}</span>}
                        </a>
                        <a href="#activity-tree" className={`menu-item ${state.activeTab === 'accountability-hub' ? 'active': ''}`} onClick={(e) => {e.preventDefault(); state.setActiveTab('accountability-hub')}}>
                            <span>🛠️</span> 
                            {!sidebarCollapsed && (<span>Production Pulse</span>)}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+P</span>
                        </a>
                    </div>

                    {isSuperUser && (
                        <div className="menu-group">
                            <span className="menu-title">Administration</span>
                            <a href="#admin" className={`menu-item ${state.activeTab === 'admin-users' ? 'active' : ''}`} onClick={() => state.setActiveTab('admin-users')}>
                                <span>🛡️</span> 
                                {!sidebarCollapsed && (<span>Team Management</span>)}
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+M</span>
                            </a>
                        </div>
                    )}
                </div>
            </aside>

            {/* FRAPPE MAIN VIEW */}
            <div className="frappe-main">
                <header className="frappe-navbar">
                    <div className="navbar-left">
                        <span className="navbar-breadcrumb">Workspace / {state.activeTab.replace('-', ' ').toUpperCase()}</span>
                    </div>
                    <div className="navbar-right">
                        <button className="btn" style={{ background: 'none' }} onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{state.user.name}</span>
                            <button className="btn-text-danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </header>
                
                <div className="frappe-content">
                    {isFactory && state.activeTab === 'tasks-workspace' && <TasksWorkspaceView state={state} />}
                    {isSales && state.activeTab === 'companies-list' && <CompaniesListView state={state} />}
                    {isSales && state.activeTab === 'company-new' && <CompanyEntryFormView state={state} />}
                    {isSales && state.activeTab === 'orders-list' && <OrdersListView state={state} />}
                    {isSales && state.activeTab === 'order-new' && <OrderEntryFormView state={state} />}
                    {isSales && state.activeTab === 'bills-list' && <BillsListView state={state} />}
                    {isSales && state.activeTab === 'bill-new' && <BillEntryFormView state={state} />}
                    {state.activeTab === 'admin-users' && isSuperUser && <AdminUserRegistryView state={state} />}
                    {isSales && state.activeTab === 'dispatch-planner' && <DispatchPlannerView state={state}/>}
                    {isFactory && state.activeTab === 'items-master' && <ItemMasterView state={state} />}
                    {isFactory && state.activeTab === "item-detail" && <ItemMasterDetailView state={state}/>}
                    {isFactory && state.activeTab === "item-create" && <ItemMasterCreateView state={state}/>}
                    {isFactory && state.activeTab === "accountability-hub" && <ActivityDashboardView state={state}/>}
                    {isTransporter && state.activeTab === 'partner-new' && <LogisticsPartnerEntryView state={state} />}
                </div>
            </div>

            <SharedAlertModal isOpen={state.isAlertOpen} message={state.alertMessage} onClose={() => state.setIsAlertOpen(false)} />
            <ToastContainer toasts={state.toasts}/>
        </div>
    );
}

export default App;