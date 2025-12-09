
"use client";
import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
	LayoutDashboard, 
	Users, 
	GraduationCap, 
	Building2, 
	LogOut, 
	Plus, 
	Search, 
	Pencil, 
	Trash2, 
	Menu,
	X,
	Loader2,
	CheckCircle2,
	AlertCircle
} from 'lucide-react';

/**
 * ==========================================
 * TYPES & INTERFACES
 * ==========================================
 */

type UserRole = 'admin' | 'user';
type AuthPageState = 'login' | 'register';

interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}

interface Department {
	id: string;
	name: string;
	code: string;
	description: string;
}

interface Student {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	departmentId: string;
	enrollmentDate: string;
}

interface Teacher {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	departmentId: string;
	specialization: string;
}

// Union type for use in PersonManager
type Person = Student | Teacher;

/**
 * ==========================================
 * MOCK API SERVICE (In-Memory Database)
 * ==========================================
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => Math.random().toString(36).substr(2, 9);

const mockDb = {
	// Initial Department Data
	departments: [
		{ id: 'dept-1', name: 'Information Technology', code: 'IT', description: 'Networking, databases and modern computing' },
		{ id: 'dept-2', name: 'Business Administration', code: 'BBA', description: 'Management, marketing, and organizational studies' },
		{ id: 'dept-3', name: 'Biotechnology', code: 'BIO', description: 'Study of living systems and biological sciences' },
	] as Department[],

	// Initial Student Data
	students: [
		{ id: 'student-IT-001', firstName: 'Ayaan', lastName: 'Rahman', email: 'ayaan@school.edu', departmentId: 'dept-1', enrollmentDate: '2024-06-10' },
		{ id: 'student-BBA-001', firstName: 'Meera', lastName: 'Nair', email: 'meera@school.edu', departmentId: 'dept-2', enrollmentDate: '2024-06-15' },
		{ id: 'student-IT-002', firstName: 'Rohan', lastName: 'Menon', email: 'rohan@school.edu', departmentId: 'dept-1', enrollmentDate: '2024-07-01' },
		{ id: 'student-BIO-001', firstName: 'Sara', lastName: 'Thomas', email: 'sara@school.edu', departmentId: 'dept-3', enrollmentDate: '2025-01-05' },
	] as Student[],

	// Initial Teacher Data
	teachers: [
		{ id: 'teacher-IT-001', firstName: 'Dr. Neha', lastName: 'Sharma', email: 'neha@school.edu', departmentId: 'dept-1', specialization: 'Cloud Computing' },
		{ id: 'teacher-BBA-001', firstName: 'Prof. Vikram', lastName: 'Singh', email: 'vikram@school.edu', departmentId: 'dept-2', specialization: 'Finance' },
		{ id: 'teacher-BIO-001', firstName: 'Dr. Aisha', lastName: 'Khan', email: 'aisha@school.edu', departmentId: 'dept-3', specialization: 'Genetics' },
	] as Teacher[],

	// Mock user storage for registration and login
	users: [
		{ id: 'u1', name: 'System Admin', email: 'admin@eduspot.edu', password: 'password', role: 'admin' },
		{ id: 'u2', name: 'Faculty Login', email: 'teacher@eduspot.edu', password: 'password', role: 'teacher' },
	] as (User & { password: string })[]
};

const api = {
	auth: {
		login: async (email: string, password: string): Promise<User> => {
			await delay(500);
			const userRecord = mockDb.users.find(u => u.email === email && u.password === password);
			if (userRecord) {
				const { password: _, ...user } = userRecord;
				return user;
			}
			throw new Error('Invalid credentials');
		},
		register: async (name: string, email: string, password: string): Promise<User> => {
			await delay(500);
			if (mockDb.users.some(u => u.email === email)) {
				throw new Error('User already exists');
			}
			const newUserRecord = { 
				id: generateId(), 
				name, 
				email, 
				password, 
				role: 'user' as UserRole 
			};
			mockDb.users.push(newUserRecord);
			
			const { password: _, ...user } = newUserRecord;
			return user;
		}
	},
	departments: {
		getAll: async () => { await delay(300); return [...mockDb.departments]; },
		create: async (data: Omit<Department, 'id'>) => {
			await delay(300);
			const newDept = { ...data, id: generateId() };
			mockDb.departments.push(newDept);
			return newDept;
		},
		update: async (id: string, data: Partial<Department>) => {
			await delay(300);
			const idx = mockDb.departments.findIndex(d => d.id === id);
			if (idx === -1) throw new Error('Department not found');
			mockDb.departments[idx] = { ...mockDb.departments[idx], ...data };
			return mockDb.departments[idx];
		},
		delete: async (id: string) => {
			await delay(300);
			mockDb.departments = mockDb.departments.filter(d => d.id !== id);
			return true;
		}
	},
	students: {
		getAll: async (deptId?: string) => { 
			await delay(300); 
			return deptId 
				? mockDb.students.filter(s => s.departmentId === deptId)
				: [...mockDb.students]; 
		},
		getById: async (id: string): Promise<Student> => {
			await delay(300);
			const student = mockDb.students.find(s => s.id === id);
			if (!student) {
				throw new Error(`Student with ID ${id} not found`);
			}
			return student;
		},
		create: async (data: Omit<Student, 'id'>) => {
			await delay(300);
			const newStudent = { ...data, id: generateId() } as Student; 
			mockDb.students.push(newStudent);
			return newStudent;
		},
		update: async (id: string, data: Partial<Student>) => {
			await delay(300);
			const idx = mockDb.students.findIndex(s => s.id === id);
			if (idx === -1) throw new Error('Not found');
			mockDb.students[idx] = { ...mockDb.students[idx], ...data } as Student;
			return mockDb.students[idx];
		},
		delete: async (id: string) => {
			await delay(300);
			mockDb.students = mockDb.students.filter(s => s.id !== id);
			return true;
		}
	},
	teachers: {
		getAll: async (deptId?: string) => { 
			await delay(300); 
			return deptId 
				? mockDb.teachers.filter(t => t.departmentId === deptId)
				: [...mockDb.teachers]; 
		},
		create: async (data: Omit<Teacher, 'id'>) => {
			await delay(300);
			const newTeacher = { ...data, id: generateId() } as Teacher;
			mockDb.teachers.push(newTeacher);
			return newTeacher;
		},
		update: async (id: string, data: Partial<Teacher>) => {
			await delay(300);
			const idx = mockDb.teachers.findIndex(t => t.id === id);
			if (idx === -1) throw new Error('Not found');
			mockDb.teachers[idx] = { ...mockDb.teachers[idx], ...data } as Teacher;
			return mockDb.teachers[idx];
		},
		delete: async (id: string) => {
			await delay(300);
			mockDb.teachers = mockDb.teachers.filter(t => t.id !== id);
			return true;
		}
	}
};

/**
 * ==========================================
 * UI COMPONENTS (Replicating ShadCN - Dark Mode Adjusted)
 * ==========================================
 */

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link', size?: 'default' | 'sm' | 'icon' }>(
	({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
		const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-slate-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
		
		const variants = {
			default: "bg-green-600 text-white hover:bg-green-700",
			destructive: "bg-red-600 text-white hover:bg-red-700",
			outline: "border border-green-600 text-green-600 bg-transparent hover:bg-green-50",
			secondary: "bg-white text-green-700 border border-green-300 hover:bg-green-50",
			ghost: "text-green-600 hover:bg-green-100",
			link: "text-green-500 underline-offset-4 hover:underline",
		};


		const sizes = {
			default: "h-10 px-4 py-2",
			sm: "h-9 rounded-md px-3",
			icon: "h-10 w-10",
		};

		return (
			<button
				ref={ref}
				className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	({ className = '', ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={`flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
	({ className = '', ...props }, ref) => (
		<label
			ref={ref}
			className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200 ${className}`}
			{...props}
		/>
	)
);
Label.displayName = "Label";

const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
	<div className={`rounded-xl border border-slate-800 bg-slate-900 text-slate-200 shadow-xl ${className}`}>
		{children}
	</div>
);

const CardHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
	<div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
	<h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
	<div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// Simplified Select for single-file (Native Select with custom styling)
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
	({ className = '', ...props }, ref) => (
		<div className="relative">
			<select
				ref={ref}
				// Dark mode styles applied here
				className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 text-white px-3 py-2 text-sm ring-offset-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-colors ${className}`}
				{...props}
			/>
			<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-white">
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
			</div>
		</div>
	)
);
Select.displayName = "Select";

// Modal Component
const Dialog = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="relative w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 text-slate-200 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
				<div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
					<h2 className="text-lg font-semibold leading-none tracking-tight text-white">{title}</h2>
				</div>
				{children}
				<button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-slate-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
					<X className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
};

// Toast Notification context
const ToastContext = createContext<{ showToast: (msg: string, type: 'success' | 'error') => void }>({ showToast: () => {} });

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	const showToast = (message: string, type: 'success' | 'error') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	const Icon = toast?.type === 'success' ? CheckCircle2 : AlertCircle;
	// Adjusted colors for better visibility on dark background
	const color = toast?.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'; 

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{toast && (
				<div className={`fixed bottom-4 right-4 z-50 flex items-center rounded-lg p-4 text-white shadow-xl animate-in slide-in-from-right-10 duration-300 ${color}`}>
					<Icon className="h-5 w-5 mr-2" />
					<span>{toast.message}</span>
				</div>
			)}
		</ToastContext.Provider>
	);
};

/**
 * ==========================================
 * FEATURES: AUTHENTICATION
 * ==========================================
 */

const AuthContext = createContext<{ 
	user: User | null; 
	login: (e: string, p: string) => Promise<void>; 
	register: (n: string, e: string, p: string) => Promise<void>;
	logout: () => void; 
	isLoading: boolean;
	setAuthPage: (p: AuthPageState) => void;
	authPage: AuthPageState;
}>({
	user: null, 
	login: async () => {}, 
	register: async () => {},
	logout: () => {}, 
	isLoading: false,
	setAuthPage: () => {},
	authPage: 'login',
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [authPage, setAuthPage] = useState<AuthPageState>('login');

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const loggedInUser = await api.auth.login(email, password);
			setUser(loggedInUser);
		} finally {
			setIsLoading(false);
		}
	};

	const register = async (name: string, email: string, password: string) => {
		setIsLoading(true);
		try {
			const registeredUser = await api.auth.register(name, email, password);
			setUser(registeredUser);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		setUser(null);
		setAuthPage('login');
	};

	const value = useMemo(() => ({
		user, login, register, logout, isLoading, authPage, setAuthPage
	}), [user, isLoading, authPage]);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};

const RegisterPage = () => {
	const { register, isLoading, setAuthPage } = useContext(AuthContext);
	const { showToast } = useContext(ToastContext);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			showToast('Passwords do not match', 'error');
			return;
		}
		if (!name || !email || password.length < 6) {
			showToast('Please fill all fields and ensure password is at least 6 characters.', 'error');
			return;
		}

		try {
			await register(name, email, password);
			showToast('Registration successful! Logging you in.', 'success');
		} catch (err: any) {
			showToast(err.message || 'Registration failed', 'error');
		}
	};

	return (
		// Dark background for auth screen
		<div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center text-white">Register</CardTitle>
					<p className="text-center text-sm text-slate-400">Create a new account</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="m@example.com" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password (min 6 chars)</Label>
							<Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
						</div>
						<Button className="w-full" type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Sign Up
						</Button>
						<div className="text-center text-sm text-slate-400 mt-4">
							Already have an account? <Button variant="link" type="button" onClick={() => setAuthPage('login')} className="p-0 h-auto">Sign In</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

const LoginPage = () => {
	const { login, isLoading, setAuthPage } = useContext(AuthContext);
	const { showToast } = useContext(ToastContext);
	const [email, setEmail] = useState('admin@eduspot.edu');
	const [password, setPassword] = useState('password');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);
			showToast('Logged in successfully', 'success');
		} catch (err: any) {
			showToast(err.message || 'Invalid credentials', 'error');
		}
	};

	return (
		// Dark background for auth screen
		<div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center text-white">EduSpot</CardTitle>
					<p className="text-center text-sm text-slate-400">Enter your email and password to sign in</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="m@example.com" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
						</div>
						<Button className="w-full" type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Sign In
						</Button>
						<div className="text-center text-sm text-slate-400 mt-4">
							Don't have an account? <Button variant="link" type="button" onClick={() => setAuthPage('register')} className="p-0 h-auto">Sign Up</Button>
						</div>
						<div className="text-center text-xs text-slate-500 mt-4">
							Try: admin@eduspot.edu / password
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

/**
 * ==========================================
 * FEATURES: DASHBOARD & LAYOUT
 * ==========================================
 */

const Sidebar = ({ currentView, setView, isMobileOpen, closeMobile }: { currentView: string, setView: (v: string) => void, isMobileOpen: boolean, closeMobile: () => void }) => {
	const { logout, user } = useContext(AuthContext);

	const menuItems = [
		{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ id: 'departments', label: 'Departments', icon: Building2 },
		{ id: 'students', label: 'Students', icon: GraduationCap },
		{ id: 'teachers', label: 'Teachers', icon: Users },
	];

	// Sidebar styles already dark, just ensuring text and borders are cohesive
	const baseClasses = "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0";
	const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full"; 

	return (
		<div className={`${baseClasses} ${mobileClasses} flex flex-col`}>
			<div className="flex h-16 items-center px-6 font-bold text-lg tracking-wider border-b border-slate-800">
				EDUSPOT
			</div>
			<div className="flex-1 py-6 space-y-1">
				{menuItems.map((item) => (
					<button
						key={item.id}
						onClick={() => { setView(item.id); closeMobile(); }}
						className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
							currentView === item.id 
								? 'bg-slate-800 text-indigo-400 border-r-4 border-indigo-500' 
								: 'text-slate-400 hover:bg-slate-800 hover:text-white'
						}`}
					>
						<item.icon className="mr-3 h-5 w-5" />
						{item.label}
					</button>
				))}
			</div>
			<div className="p-4 border-t border-slate-800">
				<div className="flex items-center mb-4 px-2">
					<div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
						{user?.name.charAt(0)}
					</div>
					<div className="ml-3">
						<p className="text-sm font-medium text-white">{user?.name}</p>
						<p className="text-xs text-slate-400">{user?.role}</p>
					</div>
				</div>
				<Button variant="destructive" className="w-full justify-start" onClick={logout}>
					<LogOut className="mr-2 h-4 w-4" />
					Logout
				</Button>
			</div>
		</div>
	);
};

// Modified DashboardHome to accept setView prop
const DashboardHome = ({ setView }: { setView: (view: string) => void }) => {
	const [stats, setStats] = useState({ depts: 0, students: 0, teachers: 0 });

	useEffect(() => {
		// Quick load stats
		setStats({
			depts: mockDb.departments.length,
			students: mockDb.students.length,
			teachers: mockDb.teachers.length
		});
	}, []);

	const StatCard = ({ title, value, icon: Icon, color }: any) => (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-slate-200">{title}</CardTitle>
				<Icon className={`h-4 w-4 ${color}`} />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-white">{value}</div>
				<p className="text-xs text-slate-400">Total registered in system</p>
			</CardContent>
		</Card>
	);

	return (
		<div className="space-y-6">
			<h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard title="Total Students" value={stats.students} icon={GraduationCap} color="text-indigo-400" />
				<StatCard title="Total Teachers" value={stats.teachers} icon={Users} color="text-emerald-400" />
				<StatCard title="Departments" value={stats.depts} icon={Building2} color="text-blue-400" />
			</div>
			
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle className="text-white">Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[1, 2, 3].map((_, i) => (
								<div key={i} className="flex items-center">
									<div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
										<CheckCircle2 className="h-4 w-4 text-emerald-400" />
									</div>
									<div className="ml-4 space-y-1">
										<p className="text-sm font-medium leading-none text-slate-100">Activity Update</p>
										<p className="text-sm text-slate-400">Department was updated successfully.</p>
									</div>
									<div className="ml-auto font-medium text-sm text-slate-400">Just now</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle className="text-white">Quick Links</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button variant="outline" className="w-full justify-start" onClick={() => setView('students')}>
							<Plus className="mr-2 h-4 w-4" /> Add Student
						</Button>
						<Button variant="outline" className="w-full justify-start" onClick={() => setView('teachers')}>
							<Plus className="mr-2 h-4 w-4" /> Add Teacher
						</Button>
						<Button variant="outline" className="w-full justify-start" onClick={() => setView('departments')}>
							<Building2 className="mr-2 h-4 w-4" /> Manage Departments
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

/**
 * ==========================================
 * GENERIC CRUD COMPONENTS
 * ==========================================
 */

const DataTable = ({ 
	data, 
	columns, 
	onEdit, 
	onDelete 
}: { 
	data: any[], 
	columns: { key: string, label: string }[], 
	onEdit: (item: any) => void, 
	onDelete: (item: any) => void 
}) => {
	if (data.length === 0) {
		return (
			<div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed border-slate-700 p-8 text-center animate-in fade-in-50">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
					<Search className="h-6 w-6 text-slate-500" />
				</div>
				<h3 className="mt-4 text-lg font-semibold text-white">No data found</h3>
				<p className="mb-4 mt-2 text-sm text-slate-400">Create a new record to get started or adjust your filters.</p>
			</div>
		);
	}

	return (
		<div className="rounded-md border border-slate-800 bg-slate-900 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm text-left text-slate-200">
					<thead className="bg-slate-800 text-white font-black border-b border-slate-700 uppercase">
						<tr>
							{columns.map(col => (
								<th key={col.key} className="px-4 py-3">{col.label}</th>
							))}
							<th className="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-800">
						{data.map((row, i) => (
							<tr key={row.id || i} className="hover:bg-slate-800/50 transition-colors">
								{columns.map(col => (
									<td key={`${row.id}-${col.key}`} className="px-4 py-3">
										{col.key.includes('.') 
											? col.key.split('.').reduce((o: any, i: string) => o[i], row) 
											: row[col.key]}
									</td>
								))}
								<td className="px-4 py-3 text-right space-x-2">
									<Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
										<Pencil className="h-4 w-4 text-indigo-400" />
									</Button>
									<Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

/**
 * ==========================================
 * VIEW: Department Manager
 * ==========================================
 */
const DepartmentView = () => {
	const { showToast } = useContext(ToastContext);
	const [data, setData] = useState<Department[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<Department | null>(null);
	
	const [filterTerm, setFilterTerm] = useState(''); 

	// Form State
	const [formData, setFormData] = useState({ name: '', code: '', description: '' });

	const loadData = async () => {
		setLoading(true);
		try {
			// Fetch all departments
			const res = await api.departments.getAll();
			setData(res);
		} catch (e) {
			showToast('Failed to load departments.', 'error');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadData(); }, []);

	// Memoized data for display, applying the ID/Code/Name filter
	const filteredData = useMemo(() => {
        if (!filterTerm.trim()) return data;

        const search = filterTerm.trim().toLowerCase();
        return data.filter(d => 
            d.id.toLowerCase().includes(search) ||
            d.name.toLowerCase().includes(search) ||
            d.code.toLowerCase().includes(search)
        );
    }, [data, filterTerm]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (editingItem) {
				await api.departments.update(editingItem.id, formData);
				showToast('Department updated successfully', 'success');
			} else {
				await api.departments.create(formData);
				showToast('Department created successfully', 'success');
			}
			setIsModalOpen(false);
			loadData();
		} catch (error) {
			showToast('Operation failed', 'error');
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditingItem(null);
		setFormData({ name: '', code: '', description: '' });
		setIsModalOpen(true);
	};

	const openEdit = (item: Department) => {
		setEditingItem(item);
		setFormData({ name: item.name, code: item.code, description: item.description });
		setIsModalOpen(true);
	};

	const handleDelete = async (item: Department) => {
		// Replace window.confirm with custom modal in production if needed.
		if (window.confirm(`Are you sure you want to delete department: ${item.name}? This action cannot be undone.`)) { 
			setLoading(true);
			try {
				await api.departments.delete(item.id);
				showToast('Department deleted successfully', 'success');
				loadData();
			} catch (e) {
				showToast('Deletion failed', 'error');
				setLoading(false);
			}
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-2xl font-bold tracking-tight text-white">Departments</h2>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
					{/* ID/Code/Name Search Input */}
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
						<Input 
							placeholder="Search ID, Code, or Name..." 
							value={filterTerm}
							onChange={(e) => setFilterTerm(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Button onClick={openCreate} disabled={loading} className="flex-shrink-0">
						<Plus className="mr-2 h-4 w-4" /> Add Department
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-indigo-400" /></div>
			) : (
				<DataTable 
					data={filteredData} // Use filtered data
					columns={[
						{ key: 'id', label: 'ID' },
						{ key: 'name', label: 'Name' },
						{ key: 'code', label: 'Code' },
						{ key: 'description', label: 'Description' }
					]}
					onEdit={openEdit}
					onDelete={handleDelete}
				/>
			)}

			{/* Department Create/Edit Modal */}
			<Dialog 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				title={editingItem ? `Edit Department: ${editingItem.name}` : 'Create New Department'}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>Department Name</Label>
						<Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
					</div>
					<div className="space-y-2">
						<Label>Code (e.g., CS, MATH)</Label>
						<Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
					</div>
					<div className="space-y-2">
						<Label>Description</Label>
						<Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
					</div>
					<div className="flex justify-end pt-4">
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{editingItem ? 'Update Department' : 'Create Department'}
						</Button>
					</div>
				</form>
			</Dialog>
		</div>
	);
};


/**
 * ==========================================
 * VIEW: Student/Teacher Manager
 * ==========================================
 */
const PersonManager = ({ type }: { type: 'student' | 'teacher' }) => {
	const { showToast } = useContext(ToastContext);
	// State to hold the fetched data (filtered only by department)
	const [fetchedPeople, setFetchedPeople] = useState<(Person & { departmentName: string })[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loading, setLoading] = useState(true);
	
	// Filter States
	const [filterDept, setFilterDept] = useState('');
	const [filterId, setFilterId] = useState(''); // State for ID/Name search

	// Modal States
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<Person | null>(null);

	// Form State
	const initialForm = { firstName: '', lastName: '', email: '', departmentId: '', extra: '' };
	const [formData, setFormData] = useState(initialForm);

	// Refs based on type
	const apiRef = type === 'student' ? api.students : api.teachers;
	const extraFieldLabel = type === 'student' ? 'Enrollment Date' : 'Specialization';

	const loadData = async () => {
		setLoading(true);
		try {
			const [people, depts] = await Promise.all([
				// @ts-ignore
				apiRef.getAll(filterDept || undefined),
				api.departments.getAll()
			]);
			
			// Enrich data: map the department name into each person object
			const deptMap = new Map(depts.map(d => [d.id, d.name]));
			const enrichedPeople = people.map(p => ({
				...p,
				departmentName: deptMap.get(p.departmentId) || 'N/A',
				// Map the extra field for display consistency
				extra: type === 'student' 
					? (p as Student).enrollmentDate 
					: (p as Teacher).specialization
			}));

			setFetchedPeople(enrichedPeople as (Person & { departmentName: string })[]);
			setDepartments(depts);

		} catch (e) {
			showToast(`Failed to load ${type} data.`, 'error');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadData(); }, [type, filterDept]);

	// Memoized data for display, applying the ID/Name filter
	const tableData = useMemo(() => {
        let currentData = fetchedPeople;

        // Apply ID/Name Filter (Partial match on ID, First Name, or Last Name)
        if (filterId.trim()) {
            const search = filterId.trim().toLowerCase();
            currentData = currentData.filter(p => 
                p.id.toLowerCase().includes(search) ||
                p.firstName.toLowerCase().includes(search) ||
                p.lastName.toLowerCase().includes(search)
            );
        }

        return currentData;
    }, [fetchedPeople, filterId]);


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		
		// Map generic formData back to specific entity structure
		const baseData = {
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			departmentId: formData.departmentId,
		};
		
		const specificData = type === 'student'
			? { ...baseData, enrollmentDate: formData.extra } as Omit<Student, 'id'>
			: { ...baseData, specialization: formData.extra } as Omit<Teacher, 'id'>;


		try {
			if (editingItem) {
				// @ts-ignore
				await apiRef.update(editingItem.id, specificData);
				showToast(`${type} updated successfully`, 'success');
			} else {
				// @ts-ignore
				await apiRef.create(specificData);
				showToast(`${type} created successfully`, 'success');
			}
			setIsModalOpen(false);
			setFormData(initialForm);
			// Reload data, which is necessary to update the table immediately
			await loadData(); 
		} catch (error) {
			showToast('Operation failed', 'error');
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditingItem(null);
		setFormData(initialForm);
		setIsModalOpen(true);
	};

	const openEdit = (item: Person & { departmentName: string }) => {
		setEditingItem(item);
		setFormData({ 
			firstName: item.firstName, 
			lastName: item.lastName, 
			email: item.email, 
			departmentId: item.departmentId, 
			extra: type === 'student' ? (item as Student).enrollmentDate : (item as Teacher).specialization
		});
		setIsModalOpen(true);
	};

	const handleDelete = async (item: Person & { departmentName: string }) => {
		// Replace window.confirm with custom modal in production if needed.
		if (window.confirm(`Are you sure you want to delete this ${type}: ${item.firstName} ${item.lastName}? This action cannot be undone.`)) { 
			setLoading(true);
			try {
				// @ts-ignore
				await apiRef.delete(item.id);
				showToast(`${type} deleted successfully`, 'success');
				loadData();
			} catch (e) {
				showToast('Deletion failed', 'error');
				setLoading(false);
			}
		}
	};
	
	// Define columns based on type
	const columns = useMemo(() => ([
		{ key: 'id', label: 'ID' }, // Added ID column for visibility
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'departmentName', label: 'Department' },
		{ key: 'extra', label: extraFieldLabel }
	]), [type]);


	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-2xl font-bold tracking-tight text-white">{type === 'student' ? 'Students Management' : 'Teachers Management'}</h2>
				{/* Filter & Add Controls */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
					
					{/* ID/Name Search Input */}
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
						<Input 
							placeholder={`${type === 'teacher' ? 'Teacher' : 'Student'} ID or Name...`} 
							value={filterId}
							onChange={(e) => setFilterId(e.target.value)}
							className="pl-9"
						/>
					</div>
					
					{/* Department Filter */}
					<Select
						value={filterDept}
						onChange={(e) => setFilterDept(e.target.value)}
						className="min-w-[150px] flex-shrink-0"
					>
						<option value="">All Departments</option>
						{departments.map(d => (
							<option key={d.id} value={d.id}>{d.name}</option>
						))}
					</Select>
					<Button onClick={openCreate} disabled={loading} className="flex-shrink-0"><Plus className="mr-2 h-4 w-4" /> Add {type === 'student' ? 'Student' : 'Teacher'}</Button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-indigo-400" /></div>
			) : (
				<DataTable 
					data={tableData}
					columns={columns}
					onEdit={openEdit}
					onDelete={handleDelete}
				/>
			)}

			{/* Person Create/Edit Modal */}
			<Dialog 
				isOpen={isModalOpen} 
				onClose={() => { setIsModalOpen(false); setFormData(initialForm); }} 
				title={editingItem ? `Edit ${type}: ${editingItem.firstName} ${editingItem.lastName}` : `Create New ${type}`}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>First Name</Label>
							<Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
						</div>
						<div className="space-y-2">
							<Label>Last Name</Label>
							<Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
						</div>
					</div>
					<div className="space-y-2">
						<Label>Email</Label>
						<Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
					</div>
					<div className="space-y-2">
						<Label>Department</Label>
						<Select 
							value={formData.departmentId} 
							onChange={e => setFormData({...formData, departmentId: e.target.value})} 
							required
						>
							<option value="">Select Department</option>
							{departments.map(d => (
								<option key={d.id} value={d.id}>{d.name}</option>
							))}
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{extraFieldLabel}</Label>
						<Input 
							type={type === 'student' ? 'date' : 'text'}
							value={formData.extra} 
							onChange={e => setFormData({...formData, extra: e.target.value})} 
							required 
						/>
					</div>
					<div className="flex justify-end pt-4">
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{editingItem ? `Update ${type}` : `Create ${type}`}
						</Button>
					</div>
				</form>
			</Dialog>
		</div>
	);
};

/**
 * ==========================================
 * MAIN APP COMPONENT
 * ==========================================
 */

const MainApp = () => {
	const { user } = useContext(AuthContext);
	const [currentView, setCurrentView] = useState('dashboard');
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const renderView = () => {
		switch (currentView) {
			case 'dashboard':
				return <DashboardHome setView={setCurrentView} />;
			case 'departments':
				return <DepartmentView />;
			case 'students':
				return <PersonManager type="student" />;
			case 'teachers':
				return <PersonManager type="teacher" />;
			default:
				return <DashboardHome setView={setCurrentView} />;
		}
	};

	if (!user) {
		const { authPage } = useContext(AuthContext);
		return authPage === 'login' ? <LoginPage /> : <RegisterPage />;
	}

	return (
		// Global dark background and default text color
		<div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
			{/* Mobile Overlay */}
			{isMobileMenuOpen && (
				<div 
					className="fixed inset-0 z-30 bg-black/70 lg:hidden" 
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}

			<Sidebar 
				currentView={currentView} 
				setView={setCurrentView} 
				isMobileOpen={isMobileMenuOpen}
				closeMobile={() => setIsMobileMenuOpen(false)}
			/>

			<div className="flex flex-col flex-1">
				{/* Header/Navbar */}
				<header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-900 px-4 lg:px-6 shadow-xl">
					<Button 
						variant="ghost" 
						size="icon" 
						className="lg:hidden" 
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					>
						{isMobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
					</Button>
					<h1 className="text-xl font-semibold tracking-tight capitalize text-white">{currentView.replace(/s$/, '')}</h1>
					<div className="ml-auto flex items-center space-x-4">
						<span className="text-sm font-medium text-slate-400 hidden sm:block">Welcome, {user.name} ({user.role})</span>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 p-4 lg:p-8">
					{renderView()}
				</main>
			</div>
		</div>
	);
};

// Default export is the final wrapper
const App = () => (
	<ToastProvider>
		<AuthProvider>
			<MainApp />
		</AuthProvider>
	</ToastProvider>
);

export default App;
