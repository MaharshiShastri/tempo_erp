import { useEffect, useState } from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
    Bell,
    FileText,
    Globe,
    Package,
    RefreshCw,
    LogOut,
    Moon,
    Sun,
    Truck,
    Users,
    CalendarDays,
    ClipboardList,
    Database,
    BarChart3,
    BookOpen,
    Calculator,
    Factory,
    FileSpreadsheet,
    Map,
    ShieldCheck,
    Target,
    Upload,
} from "lucide-react";

import useERPState from "./hooks/useERPState";
import packageJson from "../package.json";

import LoginView from "./views/LoginView";

import OrdersListView from "./views/OrdersListView";
import OrderEntryFormView from "./views/OrderEntryFormView";

import BillsListView from "./views/BillsListView";
import BillEntryFormView from "./views/BillEntryFormView";

import CompaniesListView from "./views/CompaniesListView";
import CompanyEntryFormView from "./views/CompanyEntryFormView";

import TasksWorkspaceView from "./views/TasksWorkspaceView";
import AdminUserRegistryView from "./views/AdminUserRegistryView";
import DispatchCalculatorView from "./views/DispatchCalculatorView";

import SharedAlertModal from "./components/shared/SharedAlertModal";
import { ToastContainer } from "./components/Shared";

import CRM_WorkspaceView from "./views/CRM_WorkspaceView";
import LogisticsPartnerEntryView from "./views/LogisticsPartnerEntryView";

import ItemMasterView from "./views/ItemMasterView";
import ItemMasterCreateView from "./views/ItemMasterCreateView";
import ItemMasterDetailView from "./views/ItemMasterDetailView";

import GRN_WorkspaceView from "./views/GRN_WorkspaceView";
import ActivityDashboardView from "./views/ActivityDashboardView";
import ItemMasterUploadView from "./views/ItemMasterUploadView";

import TallySyncView from "./views/TallySyncView";
import LeadGeneratorView from "./views/LeadGeneratorView";
import SalesAnalyticsView from "./views/SalesAnalyticsView";

import FaqWorkspaceView from "./views/FaqWorkspaceView";

import PrintInvoiceTemplate from "./print/PrintInvoiceTemplate";
import PrintOrderTemplate from "./print/PrintOrderTemplate";

import ErrorModal from "./components/shared/ErrorModal";

import GlobalProductionPulseView from "./views/GlobalProductionPulseView";
import PersonalSalesAnalyticsView from "./views/PersonalSalesAnalyticsView";

import TallyImportWorkspaceView from "./views/TallyImportWorkspaceView";
import GeoAnalyticsView from "./views/GeoAnalyticsView";
import TallyInvoiceImportWorkspaceView from "./views/TallyInvoiceImportWorkspaceView";

import TransportAnalyticsView from "./views/TransportAnalyticsView";
import ProductionAnalyticsView from "./views/ProductionAnalyticsView";
import InventoryAuditLogsView from "./views/InventoryAuditLogsView";

import LogisticsPartnerReadOnlyView from "./views/LogisticsPartnerReadOnlyView";
import DispatchPlannerView from "./views/DispatchPlannerView";

import QuoteGenerationView from "./views/QuoteGenerationView";
import QuotationListView from "./views/QuotationListView";

import ExerciseGenerator from "./views/ExerciseGeneratorView";
import ProductionCalendar from "./components/production/ProductionCalendar";
import PromptGeneratorView from "./views/PromptGenerator";

function App() {
    const state = useERPState();

    const [theme, setTheme] = useState(
        () => localStorage.getItem("erp-theme") || "light"
    );

    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const APP_VERSION = packageJson.version;

    /*
     * ------------------------------------------------------------------
     * THEME
     * ------------------------------------------------------------------
     */

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("erp-theme", theme);
    }, [theme]);

    /*
     * ------------------------------------------------------------------
     * RESTORE SESSION
     * ------------------------------------------------------------------
     */

    useEffect(() => {
        const savedSession = localStorage.getItem("tempo_erp_user");

        if (!savedSession) {
            return;
        }

        try {
            const parsedUser = JSON.parse(savedSession);

            if (parsedUser && typeof parsedUser === "object") {
                state.setUser(parsedUser);
            } else {
                localStorage.removeItem("tempo_erp_user");
            }
        } catch (error) {
            console.error("Corrupted session data:", error);
            localStorage.removeItem("tempo_erp_user");
        }

        // We intentionally only run this on initial mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * ------------------------------------------------------------------
     * GLOBAL ERROR / AUTH ERROR HANDLING
     *
     * IMPORTANT:
     * This hook MUST be above the `if (!state.user)` return.
     * Otherwise React gets a different hook order after login/logout.
     * ------------------------------------------------------------------
     */

    useEffect(() => {
        const isUnauthorized = (error) => {
            if (!error) {
                return false;
            }

            const status = error.status || error.statusCode;

            const message = (
                error.message ||
                String(error)
            ).toLowerCase();

            return (
                status === 401 ||
                status === "401" ||
                message.includes("401") ||
                message.includes("unauthorized") ||
                message.includes("invalid token")
            );
        };

        const logoutBecauseUnauthorized = () => {
            localStorage.removeItem("tempo_erp_user");

            /*
             * Don't call setUser() and reload simultaneously.
             * Reloading is enough to return the app to LoginView.
             */
            window.location.reload();
        };

        const handleError = (event) => {
            const error = event?.error;

            if (isUnauthorized(error)) {
                logoutBecauseUnauthorized();
                return;
            }

            const message =
                error?.message ||
                event?.message ||
                "An unexpected application error occurred.";

            try {
                state.showErrorModal(
                    "Application Error",
                    message
                );
            } catch (modalError) {
                console.error(
                    "Unable to display application error modal:",
                    modalError
                );
            }

            console.error("Application Error:", error || event);
        };

        const handleRejection = (event) => {
            const reason = event?.reason;

            if (isUnauthorized(reason)) {
                logoutBecauseUnauthorized();
                return;
            }

            const message =
                reason?.message ||
                String(reason) ||
                "An unhandled promise rejection occurred.";

            try {
                state.showErrorModal(
                    "Unhandled Promise Rejection",
                    message
                );
            } catch (modalError) {
                console.error(
                    "Unable to display rejection modal:",
                    modalError
                );
            }

            console.error(
                "Unhandled Promise Rejection:",
                reason
            );
        };

        window.addEventListener("error", handleError);
        window.addEventListener(
            "unhandledrejection",
            handleRejection
        );

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener(
                "unhandledrejection",
                handleRejection
            );
        };

        // `state` is effectively the application state facade.
        // Keeping this effect mounted for the lifetime of App is intentional.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * ------------------------------------------------------------------
     * LOGIN
     *
     * This return is AFTER every hook.
     * ------------------------------------------------------------------
     */

    if (!state.user) {
        return <LoginView state={state} />;
    }

    /*
     * ------------------------------------------------------------------
     * ROLE PERMISSIONS
     * ------------------------------------------------------------------
     */

    const userRole = state.user?.role;

    const isSuperUser =
        userRole === "Chief Full Stack Developer" ||
        userRole === "Admin";

    const isFactory =
        userRole === "Shop Floor Administrator" ||
        userRole === "Admin" ||
        userRole === "Chief Full Stack Developer";

    const isSales =
        userRole === "Sales Representative" ||
        userRole === "Admin" ||
        userRole === "Chief Full Stack Developer";

    const isTransporter =
        userRole === "Dispatch Engineer" ||
        userRole === "Chief Full Stack Developer" ||
        userRole === "Admin";

    const pendingTasksCount = (state.tasks || []).filter(
        (task) =>
            task?.is_incomplete &&
            task?.direction === "received"
    ).length;

    /*
     * ------------------------------------------------------------------
     * LOGOUT
     * ------------------------------------------------------------------
     */

    const handleLogout = () => {
        localStorage.removeItem("tempo_erp_user");
        state.setUser(null);
    };

    /*
     * ------------------------------------------------------------------
     * NAVIGATION ITEM
     * ------------------------------------------------------------------
     */

    const NavItem = ({
    icon: Icon,
    label,
    active = false,
    onClick,
    shortcut,
    badge,
    iconClassName = "text-muted-foreground",
}) => {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={active}
                onClick={onClick}
                tooltip={label}
                className="
                    group h-9 transition-all duration-200
                    hover:bg-muted/70
                    data-[active=true]:bg-primary/10
                    data-[active=true]:font-medium
                "
            >
                <div
                    className={`
                        flex size-7 shrink-0 items-center justify-center
                        rounded-md transition-all duration-200
                        group-hover:bg-background/70
                        ${active ? "bg-background shadow-sm" : ""}
                    `}
                >
                    <Icon
                        className={`
                            size-4 shrink-0
                            ${active ? "text-primary" : iconClassName}
                        `}
                    />
                </div>

                <span className="truncate">
                    {label}
                </span>

                {badge > 0 && (
                    <Badge
                        variant="destructive"
                        className="
                            ml-auto h-5 min-w-5
                            justify-center px-1
                            text-[10px]
                        "
                    >
                        {badge}
                    </Badge>
                )}

                {shortcut && (
                    <kbd
                        className="
                            ml-auto hidden rounded border
                            bg-muted px-1.5 py-0.5
                            text-[10px] text-muted-foreground
                            group-data-[collapsible=icon]:hidden
                            md:inline
                        "
                    >
                        {shortcut}
                    </kbd>
                )}
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
};
    /*
     * ------------------------------------------------------------------
     * MAIN APPLICATION
     * ------------------------------------------------------------------
     */

    return (
        <TooltipProvider>
            <SidebarProvider>
                {/*
                 * ==========================================================
                 * OFFLINE SERVER BANNER
                 * ==========================================================
                 */}

                {!state.isServerLive && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            background: "var(--brand-danger)",
                            color: "#fff",
                            padding: "8px",
                            zIndex: 9999,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "15px",
                            fontWeight: "bold",
                            fontSize: "13px",
                        }}
                    >
                        <Bell size={18} />

                        <span>
                            Server connection lost or updating.
                            System is currently operating offline.
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                            style={{
                                background:
                                    "rgba(255,255,255,0.2)",
                                border:
                                    "1px solid rgba(255,255,255,0.5)",
                                color: "#fff",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <RefreshCw size={14} />

                            Force Reload
                        </button>
                    </div>
                )}

                {/*
                 * ==========================================================
                 * MODALS
                 * ==========================================================
                 */}

                <ErrorModal
                    isOpen={state.errorModalOpen}
                    title={state.errorModal?.title}
                    message={state.errorModal?.message}
                    onClose={() =>
                        state.setErrorModalOpen(false)
                    }
                />

                {state.printType === "invoice" && (
                    <PrintInvoiceTemplate
                        invoiceData={state.activePrintJob}
                    />
                )}

                {state.printType === "order" && (
                    <PrintOrderTemplate
                        orderData={state.activePrintJob}
                    />
                )}

                {/*
                 * ==========================================================
                 * SIDEBAR
                 * ==========================================================
                 */}

                <Sidebar collapsible="icon" 
                    /*className="frappe-sidebar"*/
                >
                    <SidebarHeader className="border-b">
                        <div className="flex h-14 items-center gap-2 px-2">
                            <div className="
                                flex size-9 shrink-0
                                items-center justify-center
                                rounded-lg
                                bg-gradient-to-br
                                from-blue-500 to-violet-600
                                text-white
                                shadow-sm">
                                <Package className="size-4" /> 
                            </div>

                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold">
                                    Tempo ERP
                                </span>

                                <span className="truncate text-xs text-muted-foreground">
                                    Enterprise Workspace
                                </span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        {/*
                         * ==================================================
                         * GLOBAL WORKSPACE
                         * ==================================================
                         */}

                        <SidebarGroup>
                            <SidebarGroupLabel>
                                Global Workspace
                            </SidebarGroupLabel>

                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <NavItem
                                        icon={Globe}
                                        label="Production Lifecycle"
                                        active={state.activeTab === "global-pulse"}
                                        onClick={() => state.setActiveTab("global-pulse")}
                                        iconClassName="text-sky-500"
                                    />

                                    <NavItem
                                        icon={BookOpen}
                                        label="R&D Knowledge Base"
                                        active={state.activeTab === "faq-workspace"}
                                        onClick={() => state.setActiveTab("faq-workspace")}
                                        iconClassName="text-violet-500"
                                    />

                                    <NavItem
                                        icon={Package}
                                        label="Item Master"
                                        shortcut="Alt+I"
                                        active={state.activeTab === "items-master"}
                                        onClick={() => state.setActiveTab("items-master")}
                                        iconClassName="text-amber-500"
                                    />

                                    <NavItem
                                        icon={CalendarDays}
                                        label="Factory Schedule"
                                        active={state.activeTab === "production-calendar"}
                                        onClick={() => state.setActiveTab("production-calendar")}
                                        iconClassName="text-rose-500"
                                    />

                                    <NavItem
                                        icon={FileText}
                                        label="Prompt Generator"
                                        active={state.activeTab === "prompt"}
                                        onClick={() => state.setActiveTab("prompt")}
                                        iconClassName="text-cyan-500"
                                    />
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/*
                         * ==================================================
                         * SALES MODULE
                         * ==================================================
                         */}

                        {isSales && (
                            <SidebarGroup>
                                <SidebarGroupLabel>
                                    Sales Module
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <NavItem
                                        icon={Users}
                                        label="Clients Directory"
                                        iconClassName="text-blue-500"
                                        shortcut="Alt+C"
                                        active={
                                            state.activeTab === "companies-list" ||
                                            state.activeTab === "company-new"
                                        }
                                        onClick={() =>
                                            state.setActiveTab("companies-list")
                                        }
                                    />

                                    <NavItem
                                        icon={Package}
                                        label="Orders Blueprints"
                                        iconClassName="text-orange-500"
                                        shortcut="Alt+O"
                                        active={
                                            state.activeTab === "orders-list" ||
                                            state.activeTab === "order-new"
                                        }
                                        onClick={() =>
                                            state.setActiveTab("orders-list")
                                        }
                                    />

                                    <NavItem
                                        icon={FileText}
                                        label="Billing Ledgers"
                                        iconClassName="text-emerald-500"
                                        shortcut="Alt+B"
                                        active={
                                            state.activeTab === "bills-list" ||
                                            state.activeTab === "bill-new"
                                        }
                                        onClick={() =>
                                            state.setActiveTab("bills-list")
                                        }
                                    />

                                    <NavItem
                                        icon={Target}
                                        label="CRM Pipeline"
                                        iconClassName="text-purple-500"
                                        shortcut="Alt+W"
                                        active={state.activeTab === "crm-workspace"}
                                        onClick={() =>
                                            state.setActiveTab("crm-workspace")
                                        }
                                    />

                                    <NavItem
                                        icon={Factory}
                                        label="Lead Generator"
                                        iconClassName="text-pink-500"
                                        shortcut="Alt+E"
                                        active={state.activeTab === "lead-generation"}
                                        onClick={() =>
                                            state.setActiveTab("lead-generation")
                                        }
                                    />

                                    <NavItem
                                        icon={FileSpreadsheet}
                                        label="Quotes List"
                                        iconClassName="text-teal-500"
                                        active={state.activeTab === "qoute-list"}
                                        onClick={() =>
                                            state.setActiveTab("qoute-list")
                                        }
                                    />

                                    <NavItem
                                        icon={BarChart3}
                                        label="Personal Target"
                                        iconClassName="text-indigo-500"
                                        active={state.activeTab === "target"}
                                        onClick={() =>
                                            state.setActiveTab("target")
                                        }
                                    />
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        {/*
                         * ==================================================
                         * SHOP FLOOR
                         * ==================================================
                         */}

                        {isFactory && (
                            <SidebarGroup>
                                <SidebarGroupLabel>
                                    Shop Floor
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <NavItem
                                            icon={ClipboardList}
                                            label="Task Management"
                                            iconClassName="text-blue-500"
                                            shortcut="Alt+T"
                                            badge={pendingTasksCount}
                                            active={state.activeTab === "tasks-workspace"}
                                            onClick={() =>
                                                state.setActiveTab("tasks-workspace")
                                            }
                                        />

                                        <NavItem
                                            icon={ClipboardList}
                                            label="Legacy Logs"
                                            iconClassName="text-slate-500"
                                            shortcut="Alt+P"
                                            active={
                                                state.activeTab === "accountability-hub"
                                            }
                                            onClick={() =>
                                                state.setActiveTab("accountability-hub")
                                            }
                                        />

                                        <NavItem
                                            icon={Package}
                                            label="GRN Workspace"
                                            iconClassName="text-lime-600"
                                            shortcut="Alt+R"
                                            active={state.activeTab === "grn-workspace"}
                                            onClick={() =>
                                                state.setActiveTab("grn-workspace")
                                            }
                                        />

                                        <NavItem
                                            icon={Upload}
                                            label="Bulk Import Items"
                                            iconClassName="text-cyan-500"
                                            active={state.activeTab === "items-upload"}
                                            onClick={() =>
                                                state.setActiveTab("items-upload")
                                            }
                                        />

                                        <NavItem
                                            icon={BookOpen}
                                            label="Inventory Audit"
                                            iconClassName="text-red-500"
                                            active={state.activeTab === "audit"}
                                            onClick={() =>
                                                state.setActiveTab("audit")
                                            }
                                        />

                                        <NavItem
                                            icon={BarChart3}
                                            label="Production Analytics"
                                            iconClassName="text-violet-500"
                                            active={state.activeTab === "prod-stats"}
                                            onClick={() =>
                                                state.setActiveTab("prod-stats")
                                            }
                                        />
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        {/*
                         * ==================================================
                         * TRANSPORT
                         * ==================================================
                         */}

                        {(isTransporter || isSales) && (
                            <SidebarGroup>
                                <SidebarGroupLabel>
                                    Transport
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {(isSales ||
                                            isTransporter) && (
                                            <NavItem
                                                icon={Calculator}
                                                label="Dispatch Calculator"
                                                iconClassName="text-blue-500"
                                                shortcut="Alt+D"
                                                active={
                                                    state.activeTab === "dispatch-calculator"
                                                }
                                                onClick={() =>
                                                    state.setActiveTab("dispatch-calculator")
                                                }
                                            />
                                        )}

                                        {isTransporter && (
                                            <NavItem
                                                icon={Users}
                                                label="Logistics Master"
                                                shortcut="Alt+L"
                                                active={
                                                    state.activeTab ===
                                                    "partner-new"
                                                }
                                                onClick={() =>
                                                    state.setActiveTab(
                                                        "partner-new"
                                                    )
                                                }
                                                iconClassName="text-indigo-500"
                                            />
                                        )}

                                        {isTransporter && (
                                            <NavItem
                                                icon={BarChart3}
                                                label="Transport Analytics"
                                                active={
                                                    state.activeTab ===
                                                    "transport-analytics"
                                                }
                                                onClick={() =>
                                                    state.setActiveTab(
                                                        "transport-analytics"
                                                    )
                                                }
                                                iconClassName="text-purple-500"
                                            />
                                        )}

                                        {(isSales ||
                                            isTransporter) && (
                                            <NavItem
                                                icon={Truck}
                                                label="Logistics Partner Information"
                                                active={
                                                    state.activeTab ===
                                                    "logistics-read"
                                                }
                                                onClick={() =>
                                                    state.setActiveTab(
                                                        "logistics-read"
                                                    )
                                                }
                                                iconClassName="text-orange-500"
                                            />
                                        )}

                                        {isTransporter && (
                                            <NavItem
                                                icon={Truck}
                                                label="Dispatch Planner"
                                                active={
                                                    state.activeTab ===
                                                    "dispatch-planner"
                                                }
                                                onClick={() =>
                                                    state.setActiveTab(
                                                        "dispatch-planner"
                                                    )
                                                }
                                                iconClassName="text-emerald-500"
                                            />
                                        )}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

                        {/*
                         * ==================================================
                         * ADMINISTRATION
                         * ==================================================
                         */}

                        {isSuperUser && (
                            <SidebarGroup>
                                <SidebarGroupLabel>
                                    Administration
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <NavItem
                                            icon={ShieldCheck}
                                            label="Team Management"
                                            iconClassName="text-red-500"
                                            shortcut="Alt+M"
                                            active={state.activeTab === "admin-users"}
                                            onClick={() =>
                                                state.setActiveTab("admin-users")
                                            }
                                        />

                                        <NavItem
                                            icon={Database}
                                            label="Fetch Tally Bill Data"
                                            iconClassName="text-amber-500"
                                            shortcut="Alt+F"
                                            active={state.activeTab === "tally-bill"}
                                            onClick={() =>
                                                state.setActiveTab("tally-bill")
                                            }
                                        />

                                        <NavItem
                                            icon={Database}
                                            label="Fetch Tally Sync View"
                                            iconClassName="text-cyan-500"
                                            shortcut="Alt+F"
                                            active={state.activeTab === "tally-sync"}
                                            onClick={() =>
                                                state.setActiveTab("tally-sync")
                                            }
                                        />

                                        <NavItem
                                            icon={BarChart3}
                                            label="Sales Analytics"
                                            iconClassName="text-blue-500"
                                            shortcut="Alt+S"
                                            active={
                                                state.activeTab === "sales-analytics"
                                            }
                                            onClick={() =>
                                                state.setActiveTab("sales-analytics")
                                            }
                                        />

                                        <NavItem
                                            icon={Users}
                                            label="Exercise Generator"
                                            iconClassName="text-pink-500"
                                            active={state.activeTab === "exercise"}
                                            onClick={() =>
                                                state.setActiveTab("exercise")
                                            }
                                        />

                                        <NavItem
                                            icon={Map}
                                            label="Geo Analytics"
                                            iconClassName="text-green-500"
                                            active={state.activeTab === "map"}
                                            onClick={() =>
                                                state.setActiveTab("map")
                                            }
                                        />
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}
                    </SidebarContent>

                    <SidebarFooter className="border-t">
                        <div className="flex items-center gap-2 p-2">
                            <Avatar className="size-8">
                                <AvatarFallback>
                                    {state.user?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                <p className="truncate text-sm font-medium">
                                    {state.user?.name}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                    {state.user?.role}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="group-data-[collapsible=icon]:hidden"
                                title="Logout"
                            >
                                <LogOut className="size-4" />
                            </Button>
                        </div>
                    </SidebarFooter>

                    <SidebarRail className="z-50"/>
                </Sidebar>

                {/*
                 * ==========================================================
                 * MAIN AREA
                 * ==========================================================
                 */}

                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
                        <SidebarTrigger />

                        <Separator
                            orientation="vertical"
                            className="mr-2 h-4"
                        />

                        <div className="flex flex-1 items-center gap-2">
                            <span className="text-sm font-medium">
                                Workspace
                            </span>

                            <span className="text-muted-foreground">
                                /
                            </span>

                            <span className="text-sm text-muted-foreground">
                                {String(state.activeTab || "")
                                    .replace(/-/g, " ")
                                    .replace(
                                        /\b\w/g,
                                        (char) => char.toUpperCase()
                                    )}
                            </span>
                        </div>

                        <Badge variant="outline">
                            v{APP_VERSION}
                        </Badge>

                        <DropdownMenu
                            open={showNotifDropdown}
                            onOpenChange={(open) => {
                                setShowNotifDropdown(open);

                                if (
                                    open &&
                                    typeof state.markAllNotifsRead === "function"
                                ) {
                                    state.markAllNotifsRead();
                                }
                            }}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative"
                                >
                                    <Bell className="size-4 text-amber-500" />

                                    {state.unreadNotifCount > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
                                        >
                                            {state.unreadNotifCount}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-96"
                            >
                                <div className="p-4">
                                    <p className="text-sm font-medium">
                                        Notifications
                                    </p>

                                    {(state.notifications || []).length === 0 ? (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            No notifications.
                                        </p>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            {(state.notifications || [])
                                                .slice(0, 10)
                                                .map((notification, index) => (
                                                    <div
                                                        key={
                                                            notification?.id ||
                                                            index
                                                        }
                                                        className="rounded-md border p-2 text-sm"
                                                    >
                                                        {notification?.message ||
                                                            notification?.title ||
                                                            "Notification"}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setTheme((previousTheme) =>
                                    previousTheme === "light"
                                        ? "dark"
                                        : "light"
                                )
                            }
                            title={
                                theme === "light"
                                    ? "Switch to dark mode"
                                    : "Switch to light mode"
                            }
                        >
                            {theme === "light" ? (
                                <Moon className="size-4 text-violet-500" />
                            ) : (
                                <Sun className="size-4 text-amber-500" />
                            )}
                        </Button>
                    </header>

                    <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6">
                        <div className="mx-auto w-full max-w-[1600px]">
                            {/*
                             * =================================================
                             * FACTORY
                             * =================================================
                             */}

                            {isFactory &&
                                state.activeTab ===
                                    "tasks-workspace" && (
                                    <TasksWorkspaceView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * SALES
                             * =================================================
                             */}

                            {isSales &&
                                state.activeTab ===
                                    "companies-list" && (
                                    <CompaniesListView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "company-new" && (
                                    <CompanyEntryFormView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "orders-list" && (
                                    <OrdersListView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "order-new" && (
                                    <OrderEntryFormView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "bills-list" && (
                                    <BillsListView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "bill-new" && (
                                    <BillEntryFormView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * ADMIN
                             * =================================================
                             */}

                            {isSuperUser &&
                                state.activeTab ===
                                    "admin-users" && (
                                    <AdminUserRegistryView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * DISPATCH
                             * =================================================
                             */}

                            {(isSales ||
                                isTransporter) &&
                                state.activeTab ===
                                    "dispatch-calculator" && (
                                    <DispatchCalculatorView
                                        state={state}
                                        theme={theme}
                                        setTheme={setTheme}
                                    />
                                )}

                            {/*
                             * =================================================
                             * ITEM MASTER
                             * =================================================
                             */}

                            {state.activeTab ===
                                "items-master" && (
                                <ItemMasterView
                                    state={state}
                                />
                            )}

                            {isFactory &&
                                state.activeTab ===
                                    "item-detail" && (
                                    <ItemMasterDetailView
                                        state={state}
                                    />
                                )}

                            {isFactory &&
                                state.activeTab ===
                                    "item-create" && (
                                    <ItemMasterCreateView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * ACTIVITY
                             * =================================================
                             */}

                            {isFactory &&
                                state.activeTab ===
                                    "accountability-hub" && (
                                    <ActivityDashboardView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * LOGISTICS
                             * =================================================
                             */}

                            {isTransporter &&
                                state.activeTab ===
                                    "partner-new" && (
                                    <LogisticsPartnerEntryView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "crm-workspace" && (
                                    <CRM_WorkspaceView
                                        state={state}
                                    />
                                )}

                            {isFactory &&
                                state.activeTab ===
                                    "grn-workspace" && (
                                    <GRN_WorkspaceView
                                        state={state}
                                    />
                                )}

                            {isFactory &&
                                state.activeTab ===
                                    "items-upload" && (
                                    <ItemMasterUploadView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * TALLY
                             * =================================================
                             */}

                            {isSuperUser &&
                                state.activeTab ===
                                    "tally-sync" && (
                                    <TallySyncView
                                        state={state}
                                    />
                                )}

                            {isSuperUser &&
                                state.activeTab ===
                                    "tally-bill" && (
                                    <TallyImportWorkspaceView
                                        state={state}
                                    />
                                )}

                            {isSuperUser &&
                                state.activeTab ===
                                    "tally-invoice-import" && (
                                    <TallyInvoiceImportWorkspaceView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * SALES ANALYTICS / CRM
                             * =================================================
                             */}

                            {isSales &&
                                state.activeTab ===
                                    "lead-generation" && (
                                    <LeadGeneratorView
                                        state={state}
                                    />
                                )}

                            {isSuperUser &&
                                state.activeTab ===
                                    "sales-analytics" && (
                                    <SalesAnalyticsView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab === "target" && (
                                    <PersonalSalesAnalyticsView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * GLOBAL
                             * =================================================
                             */}

                            {state.activeTab ===
                                "faq-workspace" && (
                                <FaqWorkspaceView
                                    state={state}
                                />
                            )}

                            {state.activeTab ===
                                "production-calendar" && (
                                <ProductionCalendar
                                    state={state}
                                />
                            )}

                            {state.activeTab ===
                                "global-pulse" && (
                                <GlobalProductionPulseView
                                    state={state}
                                />
                            )}

                            {state.activeTab ===
                                "prompt" && (
                                <PromptGeneratorView
                                    state={state}
                                />
                            )}

                            {/*
                             * =================================================
                             * ADMIN ANALYTICS
                             * =================================================
                             */}

                            {isSuperUser &&
                                state.activeTab ===
                                    "exercise" && (
                                    <ExerciseGenerator
                                        state={state}
                                    />
                                )}

                            {isSuperUser &&
                                state.activeTab ===
                                    "map" && (
                                    <GeoAnalyticsView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * TRANSPORT ANALYTICS
                             * =================================================
                             */}

                            {isTransporter &&
                                state.activeTab ===
                                    "transport-analytics" && (
                                    <TransportAnalyticsView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * PRODUCTION
                             * =================================================
                             */}

                            {isFactory &&
                                state.activeTab ===
                                    "prod-stats" && (
                                    <ProductionAnalyticsView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * AUDIT
                             * =================================================
                             */}

                            {isFactory &&
                                state.activeTab ===
                                    "audit" && (
                                    <InventoryAuditLogsView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * LOGISTICS READ ONLY
                             * =================================================
                             */}

                            {(isSales ||
                                isTransporter) &&
                                state.activeTab ===
                                    "logistics-read" && (
                                    <LogisticsPartnerReadOnlyView
                                        state={state}
                                    />
                                )}

                            {/*
                             * =================================================
                             * DISPATCH PLANNER
                             *
                             * Keeping your existing prop contract here.
                             * =================================================
                             */}

                            {isTransporter &&
                                state.activeTab ===
                                    "dispatch-planner" && (
                                    <DispatchPlannerView
                                        state={
                                            state.dispatchPlanner
                                        }
                                    />
                                )}

                            {/*
                             * =================================================
                             * QUOTATIONS
                             * =================================================
                             */}

                            {isSales &&
                                state.activeTab ===
                                    "qoute-list" && (
                                    <QuotationListView
                                        state={state}
                                    />
                                )}

                            {isSales &&
                                state.activeTab ===
                                    "quote-generation" && (
                                    <QuoteGenerationView
                                        state={state}
                                    />
                                )}
                        </div>
                    </main>
                </SidebarInset>

                {/*
                 * ==========================================================
                 * GLOBAL ALERTS / TOASTS
                 * ==========================================================
                 */}

                <SharedAlertModal
                    isOpen={state.isAlertOpen}
                    message={state.alertMessage}
                    onClose={() =>
                        state.setIsAlertOpen(false)
                    }
                />

                <ToastContainer
                    toasts={state.toasts}
                />
            </SidebarProvider>
        </TooltipProvider>
    );
}

export default App;