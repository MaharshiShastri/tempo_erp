import { FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginView({ state }) {
    const {
        loading,
        showPassword,
        setShowPassword,
        modalAlert,
        setModalAlert,
        handleLogin,
        loginEmail,
        setLoginEmail,
        loginPassword,
        setLoginPassword,
    } = state;

    const themedInputClass =
        "w-full rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]";

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">

                {/* BRAND */}
                <div className="mb-8 flex items-center gap-4">
                    <img
                        src="https://tempoinstruments.com/wp-content/uploads/2024/08/tempo-instruments-logo.png"
                        alt="Tempo Instruments"
                        className="h-16 w-auto object-contain"
                    />

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                            Tempo ERP
                        </h1>

                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Precision Manufacturing Control System
                        </p>
                    </div>
                </div>

                {/* LOGIN CARD */}
                <div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >
                        <div className="border-b border-[var(--border-light)] pb-4">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                                Tempo ERP
                            </h2>

                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                Sign in to access the enterprise system.
                            </p>
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                Enter Email
                            </label>

                            <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) =>
                                    setLoginEmail(e.target.value)
                                }
                                placeholder="email"
                                className={themedInputClass}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                Enter Password
                            </label>

                            <div className="relative">
                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={loginPassword}
                                    onChange={(e) =>
                                        setLoginPassword(e.target.value)
                                    }
                                    placeholder="password"
                                    className={`${themedInputClass} pr-12`}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] p-2 text-[var(--brand-accent)] transition-colors hover:bg-[var(--combobox-hover)]"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <FiEyeOff size={20} />
                                    ) : (
                                        <FiEye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* LOGIN */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="min-w-[160px] rounded-[var(--radius-sm)] bg-[var(--brand-accent)] px-10 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Authenticating..."
                                    : "Login"}
                            </button>
                        </div>

                        <div className="border-t border-[var(--border-light)] pt-4 text-center text-xs text-[var(--text-muted)]">
                            Secure ERP Access • Authorized Personnel Only
                        </div>
                    </form>
                </div>
            </div>

            {/* ALERT MODAL */}
            {modalAlert.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg border border-[var(--border-subtle)] border-t-4 border-t-[var(--brand-danger)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                        <h3 className="text-lg font-semibold text-[var(--brand-danger)]">
                            {modalAlert.title}
                        </h3>

                        <p className="my-4 text-sm text-[var(--text-muted)]">
                            {modalAlert.message}
                        </p>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="rounded-[var(--radius-sm)] border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--combobox-hover)]"
                                onClick={() =>
                                    setModalAlert({
                                        isOpen: false,
                                        title: "",
                                        message: "",
                                    })
                                }
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}