import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';
import { dexieSync } from '@/lib/dexiesync';
import { useAuth } from '@/contexts/AuthContext';
import {
    Pill,
    AlertCircle,
    Calendar,
    CalendarDays,
    Activity,
    Package,
    Plus,
    Search,
    Bell,
    Heart,
    ChevronRight,
    ChevronDown,
    TrendingUp,
    Trash2,
    X,
    Box as BoxIcon,
    Pencil
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function Medications() {
    const { profileId } = useParams<{ profileId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddBoxModalOpen, setIsAddBoxModalOpen] = useState<string | null>(null);
    const [editingBox, setEditingBox] = useState<{ medId: string; box: any } | null>(null);
    const [expandedMeds, setExpandedMeds] = useState<Record<string, boolean>>({});
    const [inventorySortKey, setInventorySortKey] = useState<'expiry' | 'pills'>('expiry');
    const [usageInput, setUsageInput] = useState<Record<string, number>>({});
    const today = new Date();

    const [newMed, setNewMed] = useState({
        name: '',
        category: 'General',
        dosageAmount: '',
        dosageUnit: 'mg',
        pillsPerDose: 1,
        dosesPerDay: 1,
        initialPills: 30,
        numberOfBoxes: 1,
        expiryDate: format(new Date(), 'yyyy-MM')
    });

    const [newBox, setNewBox] = useState({
        dosageAmount: '',
        dosageUnit: 'mg',
        pillsPerDose: 1,
        dosesPerDay: 1,
        initialPills: 30,
        numberOfBoxes: 1,
        expiryDate: format(new Date(), 'yyyy-MM')
    });

    const profiles = useLiveQuery(() => db.medication_profiles.where('user_id').equals(user?.uid || '').filter(p => p.deleted !== 1).toArray(), [user]);
    const activeProfile = profiles?.find(p => p.id === profileId);

    const medications = useLiveQuery(
        () => db.medications.where({ user_id: user?.uid || '', profile_id: profileId || '' }).filter(m => m.deleted !== 1).toArray(),
        [user, profileId]
    );

    // Migration and Default Profile Logic
    useEffect(() => {
        const migrateAndInit = async () => {
            if (!user) return;

            // 1. Initial Profile if none exist
            const existingProfiles = await db.medication_profiles.where('user_id').equals(user.uid).toArray();
            if (existingProfiles.length === 0) {
                const defaultProfileId = crypto.randomUUID();
                await db.medication_profiles.add({
                    id: defaultProfileId,
                    user_id: user.uid,
                    name: 'Father',
                    avatar: 'Person',
                    dirty: 1,
                    last_modified: Date.now()
                } as any);
                if (!profileId) navigate(`/medications/${defaultProfileId}`);
            }

            // 2. Migration from localStorage
            const localProfiles = localStorage.getItem('medication_profiles_v1');
            const localMeds = localStorage.getItem('medication_data_v3');

            if (localProfiles) {
                try {
                    const parsedProfiles = JSON.parse(localProfiles);
                    for (const p of parsedProfiles) {
                        const exists = await db.medication_profiles.get(p.id);
                        if (!exists) {
                            await db.medication_profiles.add({
                                ...p,
                                user_id: user.uid,
                                dirty: 1,
                                last_modified: Date.now()
                            });
                        }
                    }
                    localStorage.removeItem('medication_profiles_v1');
                } catch (e) {
                    console.error("Failed to migrate profiles", e);
                }
            }

            if (localMeds) {
                try {
                    const parsedMeds = JSON.parse(localMeds);
                    for (const m of parsedMeds) {
                        const exists = await db.medications.get(m.id);
                        if (!exists) {
                            await db.medications.add({
                                ...m,
                                boxes: typeof m.boxes === 'string' ? m.boxes : JSON.stringify(m.boxes || []),
                                user_id: user.uid,
                                profile_id: m.profileId || profileId || 'default',
                                dirty: 1,
                                last_modified: Date.now()
                            });
                        }
                    }
                    localStorage.removeItem('medication_data_v3');
                } catch (e) {
                    console.error("Failed to migrate meds", e);
                }
            }

            // 3. Trigger initial sync
            try {
                await dexieSync.syncAll();
            } catch (err) {
                console.warn("[Medications] Initial sync failed:", err);
            }
        };

        migrateAndInit();

        // 4. Subscribe to real-time changes
        let unsubscribe: (() => void) | null = null;
        if (user) {
            unsubscribe = dexieSync.subscribeToChanges(user.uid, async () => {
                try {
                    await dexieSync.receiveAll();
                } catch (err) {
                    console.warn("[Medications] Real-time pull failed:", err);
                }
            });
        }

        // 5. Sync on visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden && user) {
                dexieSync.syncAll();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (unsubscribe) unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, profileId, navigate]);

    const processedMeds = useMemo(() => {
        if (!medications) return [];
        const today = new Date();
        return medications.map(med => {
            const boxes = JSON.parse(med.boxes || '[]') as any[];
            const activeBoxes = boxes.filter((b: any) => (b.currentPills || 0) > 0);
            const totalPills = activeBoxes.reduce((sum, b) => sum + (b.currentPills || 0), 0);

            let earliestExpiryStr = null;
            let daysToExpiry = Infinity;

            if (activeBoxes.length > 0) {
                const earliestBox = activeBoxes.reduce((earliest, box) => {
                    return new Date(box.expiryDate + '-02') < new Date(earliest.expiryDate + '-02') ? box : earliest;
                });
                earliestExpiryStr = earliestBox.expiryDate;
                daysToExpiry = differenceInDays(new Date(earliestExpiryStr + '-02'), today);
            }

            const daysLeft = activeBoxes
                .sort((a, b) => new Date(a.expiryDate + '-02').getTime() - new Date(b.expiryDate + '-02').getTime())
                .reduce((total, box) => {
                    const daily = (box.pillsPerDose || 1) * (box.dosesPerDay || 1);
                    return total + (daily > 0 ? Math.floor(box.currentPills / daily) : 0);
                }, 0);

            return {
                ...med,
                boxes,
                totalPills,
                activeBoxCount: activeBoxes.length,
                earliestExpiryStr,
                daysToExpiry: earliestExpiryStr ? daysToExpiry : null,
                daysLeft,
                isLowStock: earliestExpiryStr ? daysLeft <= 7 : true,
                isNearExpiry: earliestExpiryStr ? (daysToExpiry <= 30 && daysToExpiry >= 0) : false,
                isExpired: earliestExpiryStr ? daysToExpiry < 0 : false,
            };
        });
    }, [medications]);

    const stats = useMemo(() => {
        return {
            total: processedMeds.length,
            lowStock: processedMeds.filter(m => m.isLowStock).length,
            nearExpiry: processedMeds.filter(m => m.isNearExpiry || m.isExpired).length,
            dailyDoses: processedMeds.reduce((sum, m) => {
                const active = m.boxes.filter((b: any) => b.currentPills > 0)
                    .sort((a: any, b: any) => new Date(a.expiryDate + '-02').getTime() - new Date(b.expiryDate + '-02').getTime());
                return sum + (active.length > 0 ? (active[0].dosesPerDay || 0) : 0);
            }, 0),
        };
    }, [processedMeds]);

    const chartData = useMemo(() => {
        return processedMeds.filter(m => m.totalPills > 0).map(m => ({
            name: m.name,
            daysLeft: m.daysLeft,
        }));
    }, [processedMeds]);

    const handleAddMed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profileId) return;

        const qty = Math.max(1, Number(newMed.numberOfBoxes) || 1);
        const pillsPerBox = Number(newMed.initialPills) || 0;
        const totalPills = qty * pillsPerBox;

        const firstBox = {
            id: crypto.randomUUID(),
            dosage: `${newMed.dosageAmount}${newMed.dosageUnit}`,
            pillsPerDose: Number(newMed.pillsPerDose) || 1,
            dosesPerDay: Number(newMed.dosesPerDay) || 1,
            initialPills: pillsPerBox,
            currentPills: totalPills,
            boxCount: qty,
            expiryDate: newMed.expiryDate
        };

        const medToAdd = {
            id: crypto.randomUUID(),
            user_id: user.uid,
            profile_id: profileId,
            name: newMed.name,
            category: newMed.category,
            boxes: JSON.stringify([firstBox]),
            last_modified: Date.now(),
            dirty: 1
        };

        await db.medications.add(medToAdd as any);
        setIsAddModalOpen(false);
        setNewMed({
            name: '', category: 'General', dosageAmount: '', dosageUnit: 'mg',
            pillsPerDose: 1, dosesPerDay: 1, initialPills: 30, numberOfBoxes: 1,
            expiryDate: format(new Date(), 'yyyy-MM')
        });
    };

    const handleAddBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAddBoxModalOpen || !user) return;

        const med = await db.medications.get(isAddBoxModalOpen);
        if (!med) return;

        const boxes = JSON.parse(med.boxes || '[]') as any[];
        const qty = Math.max(1, Number(newBox.numberOfBoxes) || 1);
        const pillsPerBox = Number(newBox.initialPills) || 0;
        const totalNewPills = qty * pillsPerBox;

        const existingIdx = boxes.findIndex(
            b => b.dosage === `${newBox.dosageAmount}${newBox.dosageUnit}` && b.expiryDate === newBox.expiryDate
        );

        let updatedBoxes;
        if (existingIdx >= 0) {
            updatedBoxes = boxes.map((b, i) =>
                i === existingIdx
                    ? { ...b, currentPills: b.currentPills + totalNewPills, initialPills: b.initialPills + pillsPerBox, boxCount: (b.boxCount || 1) + qty }
                    : b
            );
        } else {
            updatedBoxes = [...boxes, {
                id: crypto.randomUUID(),
                dosage: `${newBox.dosageAmount}${newBox.dosageUnit}`,
                pillsPerDose: Number(newBox.pillsPerDose) || 1,
                dosesPerDay: Number(newBox.dosesPerDay) || 1,
                initialPills: pillsPerBox,
                currentPills: totalNewPills,
                boxCount: qty,
                expiryDate: newBox.expiryDate
            }];
        }

        await db.medications.update(isAddBoxModalOpen, {
            boxes: JSON.stringify(updatedBoxes),
            dirty: 1,
            last_modified: Date.now()
        });

        setIsAddBoxModalOpen(null);
        setNewBox({
            dosageAmount: '', dosageUnit: 'mg', pillsPerDose: 1, dosesPerDay: 1,
            initialPills: 30, numberOfBoxes: 1, expiryDate: format(new Date(), 'yyyy-MM')
        });
    };

    const handleEditBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBox || !user) return;

        const med = await db.medications.get(editingBox.medId);
        if (!med) return;

        const boxes = JSON.parse(med.boxes || '[]') as any[];
        const updatedBoxes = boxes.map(b =>
            b.id === editingBox.box.id
                ? {
                    ...b,
                    dosage: `${newBox.dosageAmount}${newBox.dosageUnit}`,
                    pillsPerDose: Number(newBox.pillsPerDose),
                    dosesPerDay: Number(newBox.dosesPerDay),
                    initialPills: Number(newBox.initialPills),
                    // We don't automatically change currentPills unless requested, 
                    // but for simplicity let's assume renaming/editing properties.
                    expiryDate: newBox.expiryDate
                }
                : b
        );

        await db.medications.update(editingBox.medId, {
            boxes: JSON.stringify(updatedBoxes),
            dirty: 1,
            last_modified: Date.now()
        });

        setEditingBox(null);
        setNewBox({
            dosageAmount: '', dosageUnit: 'mg', pillsPerDose: 1, dosesPerDay: 1,
            initialPills: 30, numberOfBoxes: 1, expiryDate: format(new Date(), 'yyyy-MM')
        });
    };

    const handleDeleteMed = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            await db.medications.update(id, { deleted: 1, dirty: 1, last_modified: Date.now() });
        }
    };

    const handleDeleteBox = async (medId: string, boxId: string) => {
        if (confirm("Are you sure you want to delete this specific box from inventory?")) {
            const med = await db.medications.get(medId);
            if (!med) return;
            const boxes = JSON.parse(med.boxes || '[]') as any[];
            const updatedBoxes = boxes.filter(b => b.id !== boxId);
            await db.medications.update(medId, {
                boxes: JSON.stringify(updatedBoxes),
                dirty: 1,
                last_modified: Date.now()
            });
        }
    };

    const handleLogUsage = async (medId: string) => {
        const usageVal = usageInput[medId];
        if (!usageVal || !user) return;

        const med = await db.medications.get(medId);
        if (!med) return;

        const boxes = JSON.parse(med.boxes || '[]') as any[];
        const activeBoxes = boxes.filter(b => b.currentPills > 0)
            .sort((a, b) => new Date(a.expiryDate + '-02').getTime() - new Date(b.expiryDate + '-02').getTime());

        let remainingToDeduct = usageVal;
        for (const box of activeBoxes) {
            if (remainingToDeduct <= 0) break;
            const originalBox = boxes.find(b => b.id === box.id);
            if (!originalBox) continue;

            if (originalBox.currentPills >= remainingToDeduct) {
                originalBox.currentPills -= remainingToDeduct;
                remainingToDeduct = 0;
            } else {
                remainingToDeduct -= originalBox.currentPills;
                originalBox.currentPills = 0;
            }
        }

        await db.medications.update(medId, {
            boxes: JSON.stringify(boxes),
            dirty: 1,
            last_modified: Date.now()
        });

        setUsageInput({ ...usageInput, [medId]: 0 });
    };

    if (!activeProfile && profiles && profiles.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <h2 className="text-xl font-bold">Profile Not Found</h2>
                <p className="text-slate-500">Please select a user from the sidebar.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 transition-all duration-300">
            <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8 animate-in text-slate-900">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 font-outfit capitalize">{activeProfile?.name || 'User'}'s Health</h2>
                        <p className="text-slate-500">Managing {stats.total} medications and total inventory.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 capitalize"
                    >
                        <Plus className="h-5 w-5" />
                        Add Medication
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatMiniCard title="Active meds" value={stats.total} icon={Pill} color="blue" />
                    <StatMiniCard title="Low Stock" value={stats.lowStock} icon={Package} color="red" alert={stats.lowStock > 0} />
                    <StatMiniCard title="Near Expiry" value={stats.nearExpiry} icon={AlertCircle} color="amber" alert={stats.nearExpiry > 0} />
                    <StatMiniCard title="Daily Pills" value={stats.dailyDoses} icon={Activity} color="emerald" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Inventory Tracker</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {processedMeds.length > 0 ? processedMeds.map((med) => (
                                    <div key={med.id} className="p-6 hover:bg-slate-50/50 transition-colors group relative">
                                        <div className="flex flex-col xl:flex-row gap-6 justify-between">
                                            <div className="flex gap-4">
                                                <div className={`p-3 rounded-2xl ${med.isLowStock || med.totalPills === 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                                                    <Heart className="h-6 w-6 fill-current" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                        {med.name}
                                                        {med.totalPills === 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Out of Stock</span>}
                                                    </h4>
                                                    <p className="text-slate-500 text-sm font-medium">{med.category}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        {med.earliestExpiryStr ? (
                                                            <div className={`flex items-center gap-1.5 text-xs ${med.isExpired ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                Next exp: {format(new Date(med.earliestExpiryStr + '-02'), 'MMM yyyy')}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 italic">No active boxes</div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <BoxIcon className="h-3.5 w-3.5" />
                                                            {med.activeBoxCount} Box{med.activeBoxCount !== 1 ? 'es' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4 flex-wrap">
                                                <div className="text-left">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`text-2xl font-black ${med.isLowStock || med.totalPills === 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                                            {med.totalPills}
                                                        </span>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Pills</span>
                                                    </div>
                                                    {med.totalPills > 0 && (
                                                        <div className={`mt-2 px-3 py-1 rounded-full text-[11px] font-bold inline-block ${med.isLowStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                            ~{med.daysLeft} days supply
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 min-w-[160px]">
                                                    <div className="flex bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                        <input
                                                            type="number" placeholder="Pills used" min="1"
                                                            value={usageInput[med.id] || ''}
                                                            onChange={(e) => setUsageInput({ ...usageInput, [med.id]: parseInt(e.target.value) || 0 })}
                                                            className="w-20 bg-transparent text-xs font-bold px-2 text-center outline-none border-r border-slate-200"
                                                        />
                                                        <button
                                                            onClick={() => handleLogUsage(med.id)}
                                                            disabled={med.totalPills === 0 || !usageInput[med.id]}
                                                            className="flex-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors py-1.5 px-3 disabled:opacity-50 disabled:hover:bg-transparent"
                                                        >
                                                            Log
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setIsAddBoxModalOpen(med.id)}
                                                            className="flex-1 py-1.5 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                                        >
                                                            + Add Box
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMed(med.id, med.name)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 hover:scale-110"
                                                            title="Delete Medication"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {med.boxes.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-slate-100/60">
                                                <button
                                                    onClick={() => setExpandedMeds(prev => ({ ...prev, [med.id]: !prev[med.id] }))}
                                                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <BoxIcon className="h-3.5 w-3.5" /> Inventory Breakdown
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedMeds[med.id] ? 'rotate-180' : ''}`} />
                                                </button>

                                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedMeds[med.id] ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0 m-0'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <button
                                                            onClick={() => setInventorySortKey('expiry')}
                                                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${inventorySortKey === 'expiry' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            Expiry Date
                                                        </button>
                                                        <button
                                                            onClick={() => setInventorySortKey('pills')}
                                                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${inventorySortKey === 'pills' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            Pills Left
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {med.boxes
                                                            .slice()
                                                            .sort((a: any, b: any) => {
                                                                if (inventorySortKey === 'pills') return b.currentPills - a.currentPills;
                                                                return new Date(a.expiryDate + '-02').getTime() - new Date(b.expiryDate + '-02').getTime();
                                                            })
                                                            .map((box: any) => {
                                                                const isBoxExpired = differenceInDays(new Date(box.expiryDate + '-02'), today) < 0;
                                                                const isEmpty = box.currentPills === 0;
                                                                return (
                                                                    <div key={box.id} className={`p-3 rounded-lg border space-y-1.5 ${isBoxExpired ? 'bg-red-50/60 border-red-200' : isEmpty ? 'bg-slate-50/60 border-slate-100 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-200">{box.boxCount || 1}× Box</span>
                                                                                <span className="text-sm font-bold text-slate-700">{box.dosage}</span>
                                                                                {isBoxExpired && <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                                                                            </div>
                                                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${isBoxExpired ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                                                                <Calendar className="h-3 w-3" />
                                                                                {format(new Date(box.expiryDate + '-02'), 'MMM yyyy')}
                                                                                <div className="flex items-center gap-1 ml-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const amt = box.dosage.replace(/[a-zA-Z]/g, '');
                                                                                            const unit = box.dosage.replace(/[0-9.]/g, '');
                                                                                            setNewBox({
                                                                                                dosageAmount: amt,
                                                                                                dosageUnit: unit,
                                                                                                pillsPerDose: box.pillsPerDose || 1,
                                                                                                dosesPerDay: box.dosesPerDay || 1,
                                                                                                initialPills: box.initialPills || 30,
                                                                                                numberOfBoxes: box.boxCount || 1,
                                                                                                expiryDate: box.expiryDate
                                                                                            });
                                                                                            setEditingBox({ medId: med.id, box });
                                                                                        }}
                                                                                        className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-blue-500 transition-colors"
                                                                                        title="Edit Box"
                                                                                    >
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteBox(med.id, box.id)}
                                                                                        className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-red-500 transition-colors"
                                                                                        title="Delete Box"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                                                            <span><span className="font-bold text-slate-700">{box.currentPills}</span> pills left</span>
                                                                            <span>{box.pillsPerDose}pill × {box.dosesPerDay}/day</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-12 text-center">
                                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Pill className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No medications added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {processedMeds.length > 0 && chartData.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Supply Timeline</h3>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Bar dataKey="daysLeft" radius={[6, 6, 0, 0]} barSize={40}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.daysLeft <= 7 ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <CalendarDays className="h-5 w-5 text-blue-600" />
                                Today's Routine
                            </h3>
                            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                <ScheduleList meds={processedMeds} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals Ported from standalone App.tsx */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800 font-outfit underline decoration-blue-500 underline-offset-8">New Medication</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleAddMed} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                            <div className="bg-blue-50 p-4 rounded-xl space-y-4">
                                <h4 className="font-bold text-blue-800 text-sm uppercase tracking-widest">General Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Medicine Name</label>
                                        <input
                                            required type="text" placeholder="e.g. Aspirin"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-blue-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.name}
                                            onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Category</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-blue-500 rounded-xl outline-none transition-all font-semibold appearance-none"
                                            value={newMed.category}
                                            onChange={e => setNewMed({ ...newMed, category: e.target.value })}
                                        >
                                            <option>General</option>
                                            <option>Diabetes</option>
                                            <option>Blood Pressure</option>
                                            <option>Cholesterol</option>
                                            <option>Pain Relief</option>
                                            <option>Vitamins</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-xl space-y-4">
                                <h4 className="font-bold text-amber-800 text-sm uppercase tracking-widest">First Box Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Dosage Amount & Unit</label>
                                        <div className="flex gap-2">
                                            <input
                                                required type="text" placeholder="e.g. 50"
                                                className="flex-1 px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                                value={newMed.dosageAmount}
                                                onChange={e => setNewMed({ ...newMed, dosageAmount: e.target.value })}
                                            />
                                            <select
                                                className="w-24 px-2 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-bold appearance-none text-center"
                                                value={newMed.dosageUnit}
                                                onChange={e => setNewMed({ ...newMed, dosageUnit: e.target.value })}
                                            >
                                                <option>mg</option>
                                                <option>ml</option>
                                                <option>mcg</option>
                                                <option>g</option>
                                                <option>IU</option>
                                                <option>%</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Pills/Dose</label>
                                        <input required type="number" min="1"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.pillsPerDose}
                                            onChange={e => setNewMed({ ...newMed, pillsPerDose: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Doses/Day</label>
                                        <input required type="number" min="1"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.dosesPerDay}
                                            onChange={e => setNewMed({ ...newMed, dosesPerDay: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1"># of Boxes</label>
                                        <input required type="number" min="1"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.numberOfBoxes}
                                            onChange={e => setNewMed({ ...newMed, numberOfBoxes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Pills/Box</label>
                                        <input required type="number" min="1"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.initialPills}
                                            onChange={e => setNewMed({ ...newMed, initialPills: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Expiry Date</label>
                                        <input required type="month"
                                            className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-amber-500 rounded-xl outline-none transition-all font-semibold"
                                            value={newMed.expiryDate}
                                            onChange={e => setNewMed({ ...newMed, expiryDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-[0.98]">
                                Save Medication
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAddBoxModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddBoxModalOpen(null)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 font-outfit underline decoration-amber-500 underline-offset-8">Add New Box</h3>
                        </div>
                        <form onSubmit={handleAddBox} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Dosage</label>
                                    <div className="flex gap-2">
                                        <input required type="text"
                                            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-xl outline-none font-semibold"
                                            value={newBox.dosageAmount}
                                            onChange={e => setNewBox({ ...newBox, dosageAmount: e.target.value })}
                                        />
                                        <select className="w-24 px-2 py-3 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-xl outline-none font-bold"
                                            value={newBox.dosageUnit}
                                            onChange={e => setNewBox({ ...newBox, dosageUnit: e.target.value })}
                                        >
                                            <option>mg</option><option>ml</option><option>mcg</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="# Boxes" type="number" className="p-3 bg-slate-50 rounded-xl" value={newBox.numberOfBoxes} onChange={e => setNewBox({ ...newBox, numberOfBoxes: parseInt(e.target.value) })} />
                                    <input placeholder="Pills/Box" type="number" className="p-3 bg-slate-50 rounded-xl" value={newBox.initialPills} onChange={e => setNewBox({ ...newBox, initialPills: parseInt(e.target.value) })} />
                                </div>
                                <input type="month" className="w-full p-3 bg-slate-50 rounded-xl" value={newBox.expiryDate} onChange={e => setNewBox({ ...newBox, expiryDate: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold">Add Box</button>
                        </form>
                    </div>
                </div>
            )}

            {editingBox && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingBox(null)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 font-outfit underline decoration-blue-500 underline-offset-8">Edit Box</h3>
                        </div>
                        <form onSubmit={handleEditBox} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Dosage</label>
                                    <div className="flex gap-2">
                                        <input required type="text"
                                            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-semibold"
                                            value={newBox.dosageAmount}
                                            onChange={e => setNewBox({ ...newBox, dosageAmount: e.target.value })}
                                        />
                                        <select className="w-24 px-2 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold"
                                            value={newBox.dosageUnit}
                                            onChange={e => setNewBox({ ...newBox, dosageUnit: e.target.value })}
                                        >
                                            <option>mg</option><option>ml</option><option>mcg</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">Pills/Dose</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl text-sm" value={newBox.pillsPerDose} onChange={e => setNewBox({ ...newBox, pillsPerDose: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">Doses/Day</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl text-sm" value={newBox.dosesPerDay} onChange={e => setNewBox({ ...newBox, dosesPerDay: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">Total Pills</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl text-sm" value={newBox.initialPills} onChange={e => setNewBox({ ...newBox, initialPills: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-1">Expiry</label>
                                        <input type="month" className="w-full p-3 bg-slate-50 rounded-xl text-sm" value={newBox.expiryDate} onChange={e => setNewBox({ ...newBox, expiryDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatMiniCard({ title, value, icon: Icon, color, alert }: any) {
    const colorMap: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };

    return (
        <div className={`p-5 rounded-2xl bg-white border ${colorMap[color]} shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
                <div className={`p-2 rounded-lg ${alert ? 'animate-pulse' : ''} bg-white shadow-inner`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-3xl font-black text-slate-800">{value}</div>
        </div>
    );
}

function ScheduleList({ meds }: { meds: any[] }) {
    if (meds.length === 0) return <p className="text-slate-400 text-sm text-center py-4">Add meds to see schedule.</p>;

    const getActiveDosesPerDay = (m: any) => {
        const active = m.boxes?.filter((b: any) => b.currentPills > 0)
            .sort((a: any, b: any) => new Date(a.expiryDate + '-02').getTime() - new Date(b.expiryDate + '-02').getTime());
        return active?.length > 0 ? (active[0].dosesPerDay || 1) : 1;
    };

    const morningMeds = meds.map(m => m.name);
    const midMeds = meds.filter(m => getActiveDosesPerDay(m) > 2).map(m => m.name);
    const eveningMeds = meds.filter(m => getActiveDosesPerDay(m) > 1).map(m => m.name);

    return (
        <>
            <ScheduleSlot time="08:00 AM" slotName="Morning" meds={morningMeds} status="done" />
            {midMeds.length > 0 && <ScheduleSlot time="02:00 PM" slotName="Afternoon" meds={midMeds} status="next" />}
            {eveningMeds.length > 0 && <ScheduleSlot time="08:00 PM" slotName="Evening" meds={eveningMeds} status="pending" />}
        </>
    );
}

function ScheduleSlot({ time, slotName, meds, status }: any) {
    return (
        <div className="relative pl-10 group">
            <div className={`absolute left-2.5 top-0 w-3 h-3 rounded-full border-4 border-white -translate-x-1/2 transition-colors duration-500 ${status === 'done' ? 'bg-green-500' : status === 'next' ? 'bg-blue-600 scale-125' : 'bg-slate-200'}`} />
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 tracking-tighter uppercase">{time}</span>
                {status === 'next' && <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />}
            </div>
            <h5 className={`font-bold ${status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{slotName}</h5>
            <div className="mt-2 space-y-1.5">
                {meds.map((m: any) => (
                    <div key={m} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${status === 'done' ? 'bg-green-50 border-green-100 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-xs font-semibold ${status === 'done' ? 'text-green-700 line-through' : 'text-slate-700'}`}>{m}</span>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                    </div>
                ))}
            </div>
        </div>
    );
}
