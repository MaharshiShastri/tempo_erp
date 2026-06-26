import { useEffect, useState } from "react";
import { FiMenu, FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";
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
import CRM_WorkspaceView from "./views/CRM_WorkspaceView";
import LogisticsPartnerEntryView from "./views/LogisticsPartnerEntryView";
import ItemMasterView from './views/ItemMasterView';
import ItemMasterCreateView from "./views/ItemMasterCreateView";
import ItemMasterDetailView from "./views/ItemMasterDetailView";
import GRN_WorkspaceView from "./views/GRN_WorkspaceView";
import ActivityDashboardView from "./views/ActivityDashboardView";
import ItemMasterUploadView from "./views/ItemMasterUploadView";
import TallySyncView from "./views/TallySyncView";
import LeadGeneratorView from "./views/LeadGeneratorView";
import PrintInvoiceTemplate from "./print/PrintInvoiceTemplate";
import PrintOrderTemplate from "./print/PrintOrderTemplate";
import ErrorModal from "./components/shared/ErrorModal";

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
    const isFactory = state.user.role === 'Shop Floor Administrator' || state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer';
    const isSales = state.user.role === 'Sales Representative' || state.user.role === 'Admin' || state.user.role === 'Chief Full Stack Developer';
    const isTransporter = state.user?.role === 'Dispatch Engineer' || state.user.role === 'Chief Full Stack Developer'|| state.user.role === 'Admin' ;

    useEffect(() => {
        // Helper to detect 401s regardless of how the fetch API or backend structures the error
        const isUnauthorized = (err) => {
            if (!err) return false;
            const status = err.status || err.statusCode;
            const msg = (err.message || String(err)).toLowerCase();
            return status === 401 || status === "401" || msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid token");
        };

        const handleError = (event) => { 
            if (isUnauthorized(event.error)) {
                localStorage.removeItem("tempo_erp_user");
                window.location.reload();
                return;
            }
            state.showErrorModal("Application Error", event.error?.message || event.message);
            console.error(event.error);
        };

        const handleRejection = (event) => {
            if (isUnauthorized(event.reason)) {
                localStorage.removeItem("tempo_erp_user");
                window.location.reload();
                return;
            }
            state.showErrorModal("Unhandled Promise Rejection", event.reason?.message || String(event.reason));
            console.error(event.reason);
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);

    return (
        <div className="frappe-layout">
            <ErrorModal isOpen={state.errorModalOpen} title={state.errorModal.title} message={state.errorModal.message} onClose={() => state.setErrorModalOpen(false)}/>
            {state.printType === 'invoice' && <PrintInvoiceTemplate invoiceData={state.activePrintJob} />}
            {state.printType === 'order' && <PrintOrderTemplate orderData={state.activePrintJob} />}

            {/* FRAPPE SIDEBAR */}
            <aside className={`frappe-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    {!sidebarCollapsed && <h2>Tempo ERP</h2>}
                    <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                        {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    </button>
                </div>
                
                <div className="sidebar-menu">
                    
                    {/* Render Sales group if the user has at least one of these roles */}
                    {(isSales || isTransporter) && (
                        <div className="menu-group">
                            <span className="menu-title">Sales Module</span>
                            
                            {isSales && (
                                <a href="#companies" className={`menu-item ${state.activeTab === 'companies-list' || state.activeTab === 'company-new' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); state.setActiveTab('companies-list')}}>
                                    <span>👥</span>
                                    {!sidebarCollapsed && (<span>Clients Directory</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+C</span>
                                </a>
                            )}

                            {isSales && (
                                <a href="#orders" className={`menu-item ${state.activeTab === 'orders-list' || state.activeTab === 'order-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('orders-list')}}>
                                    <span>📦</span> 
                                    {!sidebarCollapsed &&(<span>Orders Blueprints</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+O</span>
                                </a>
                            )}

                            {isSales && (
                                <a href="#billing" className={`menu-item ${state.activeTab === 'bills-list' || state.activeTab === 'bill-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('bills-list')}}>
                                    <span>🧾</span> 
                                    {!sidebarCollapsed &&(<span>Billing Ledgers</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+B</span>
                                </a>
                            )}

                            {(isSales || isTransporter) && (
                                <a href="#dispatch" className={`menu-item ${state.activeTab === 'dispatch-planner' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('dispatch-planner')}} >
                                    <span>🚚</span> 
                                    {!sidebarCollapsed &&(<span>Dispatch Planner</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+D</span>
                                </a>
                            )}

                            {isTransporter && (
                                <a href="#partner-new" className={`menu-item ${state.activeTab === 'partner-new' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('partner-new')}}>
                                    <span>🤝</span>
                                    {!sidebarCollapsed && (<span>Logistics Master</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+L</span>
                                </a>
                            )}

                            {isSales && (
                                <a href="#items" className={`menu-item ${state.activeTab === 'items-master' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('items-master')}}>
                                    <span>📦</span> 
                                    {!sidebarCollapsed && (<span>Item Master</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+I</span>
                                </a>
                            )}

                            {isSales && (
                                <a href="#crm" className={`menu-item ${state.activeTab === 'crm-workspace' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('crm-workspace')}}>
                                    <span>🎯</span> 
                                    {!sidebarCollapsed &&(<span>CRM Pipeline</span>)}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+W</span>
                                </a>
                            )}
                            {isSales && (
                                <a href="#lead-generation" className={`menu-item ${state.activeTab === 'lead-generation' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); state.setActiveTab('lead-generation')}}>
                                    <span>🏭</span>
                                    {!sidebarCollapsed && (<span>Lead Generator Engine</span>)}
                                    <span style={{fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto'}}>Alt+E</span>
                                </a>
                            )}
                        </div>
                    )}
                    
                    {/* Render Shop Floor group only if user has Factory access */}
                    {isFactory && (
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
                            
                            <a href="#grn" className={`menu-item ${state.activeTab === 'grn-workspace' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); state.setActiveTab('grn-workspace'); }}>
                                <span><FiPackage /></span>
                                {!sidebarCollapsed && <span>GRN Workspace</span>}
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>
                                    Alt+R
                                </span>
                            </a>

                            <a href="#items-upload" className={`menu-item ${state.activeTab === 'items-upload' ? 'active' : ''}`} onClick={(e) =>{e.preventDefault(); state.setActiveTab('items-upload')}}>
                                <span>📥</span> 
                                {!sidebarCollapsed && (<span>Bulk Import Items</span>)}
                            </a>
                        </div>
                    )}

                    {/* Administration group is already protected, but kept here for completeness */}
                    {isSuperUser && (
                        <div className="menu-group">
                            <span className="menu-title">Administration</span>
                            <a href="#admin" className={`menu-item ${state.activeTab === 'admin-users' ? 'active' : ''}`} onClick={() => state.setActiveTab('admin-users')}>
                                <span>🛡️</span> 
                                {!sidebarCollapsed && (<span>Team Management</span>)}
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+M</span>
                            </a>
                            <a href="#tally" className={`menu-item ${state.activeTab === 'tally-sync' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); state.setActiveTab('tally-sync')}}>
                                {/* Stylized Tally "T" Icon */}
                                <span style={{ fontWeight: '900', color: '#ffb300', fontFamily: 'Georgia, serif', fontStyle: 'italic', paddingRight: '2px' }}>T</span> 
                                {!sidebarCollapsed && (<span>Fetch Tally data</span>)}
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto' }}>Alt+F</span>
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
                    {isSuperUser && state.activeTab === 'admin-users' && <AdminUserRegistryView state={state} />}
                    {(isSales || isTransporter) && state.activeTab === 'dispatch-planner' && <DispatchPlannerView state={state}/>}
                    {isFactory && state.activeTab === 'items-master' && <ItemMasterView state={state} />}
                    {isFactory && state.activeTab === "item-detail" && <ItemMasterDetailView state={state}/>}
                    {isFactory && state.activeTab === "item-create" && <ItemMasterCreateView state={state}/>}
                    {isFactory && state.activeTab === "accountability-hub" && <ActivityDashboardView state={state}/>}
                    {isTransporter && state.activeTab === 'partner-new' && <LogisticsPartnerEntryView state={state} />}
                    {isSales && state.activeTab === 'crm-workspace' && <CRM_WorkspaceView state={state} />}
                    {isFactory && state.activeTab === 'grn-workspace' && (<GRN_WorkspaceView state={state} />)}
                    {isFactory && state.activeTab === 'items-upload' && <ItemMasterUploadView state={state} />}
                    {isSuperUser && state.activeTab === 'tally-sync' && <TallySyncView state={state}/>}
                    {isSales && state.activeTab === "lead-generation" && <LeadGeneratorView state={state}/>}
                </div>
            </div>

            <SharedAlertModal isOpen={state.isAlertOpen} message={state.alertMessage} onClose={() => state.setIsAlertOpen(false)} />
            <ToastContainer toasts={state.toasts}/>
        </div>
    );
}

export default App;