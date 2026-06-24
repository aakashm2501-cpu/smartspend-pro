import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebts } from '../hooks/useDebts';
import { DebtModal } from '../components/domain/debts/DebtModal';
import { RecordPaymentModal } from '../components/domain/debts/RecordPaymentModal';
import type { Debt } from '../types/database';
import { Plus } from 'lucide-react';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const ConstellationNode = ({ debt, angle, radius, isOwe, onClick }: { debt: Debt, angle: number, radius: number, isOwe: boolean, onClick: () => void }) => {
  // Convert polar to cartesian
  const rad = (angle - 90) * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  // Drift animation
  const driftX = [x, x + 10, x - 5, x];
  const driftY = [y, y - 10, y + 5, y];
  const duration = 10 + Math.random() * 5;

  const colorClass = isOwe ? 'border-brand-orange text-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]';
  const glowClass = isOwe ? 'bg-brand-orange/20' : 'bg-emerald-400/20';

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 cursor-pointer z-20"
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ x: driftX, y: driftY, opacity: 1 }}
      transition={{ 
        opacity: { duration: 1 },
        x: { repeat: Infinity, duration, ease: "easeInOut" },
        y: { repeat: Infinity, duration: duration * 1.2, ease: "easeInOut" }
      }}
      onClick={onClick}
      style={{ marginLeft: -32, marginTop: -32 }} // half of w-16 h-16
    >
      <div className="relative group flex flex-col items-center">
        {/* Tether Line (SVG) from center to node - simplified by using a CSS line from the node pointing to center */}
        {/* For true SVG tethers, we'd draw an SVG underneath everything, but here we can just use a pseudo-element or absolutely positioned div rotating to center */}
        
        {/* Node */}
        <div className={`w-16 h-16 rounded-full border-2 ${colorClass} bg-[#09090B] flex items-center justify-center font-outfit font-black text-xl backdrop-blur-md relative z-10 transition-transform group-hover:scale-110`}>
          {getInitials(debt.person_name)}
          <div className={`absolute inset-0 rounded-full blur-xl ${glowClass} -z-10`} />
        </div>
        
        {/* Label */}
        <div className="absolute top-full mt-2 flex flex-col items-center pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-white font-bold text-sm whitespace-nowrap bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-md">
            {debt.person_name}
          </span>
          <span className={`font-outfit font-bold ${isOwe ? 'text-brand-orange' : 'text-emerald-400'} text-xs mt-0.5`}>
            {formatINR(debt.outstanding_balance)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const SvgTethers = ({ nodes, isOweGroup }: { nodes: any[], isOweGroup: boolean }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isOweGroup ? 'rgba(249,115,22,0.4)' : 'rgba(52,211,153,0.4)'} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {nodes.map((node, i) => {
        const rad = (node.angle - 90) * (Math.PI / 180);
        // Start from center, end at node position
        const x2 = `calc(50% + ${Math.cos(rad) * node.radius}px)`;
        const y2 = `calc(50% + ${Math.sin(rad) * node.radius}px)`;
        
        // Stroke width proportional to amount (clamped)
        const strokeW = Math.max(1, Math.min(6, node.debt.outstanding_balance / 1000));
        
        return (
          <motion.line 
            key={i}
            x1="50%" 
            y1="50%" 
            x2={x2} 
            y2={y2} 
            stroke={isOweGroup ? 'rgba(249,115,22,0.3)' : 'rgba(52,211,153,0.3)'}
            strokeWidth={strokeW}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        );
      })}
    </svg>
  );
};

const Debts: React.FC = () => {
  const { data: debts } = useDebts();

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const activeDebts = useMemo(() => debts?.filter(d => d.status !== 'completed') || [], [debts]);
  const oweDebts = useMemo(() => activeDebts.filter(d => d.debt_type === 'owe_money'), [activeDebts]);
  const owedDebts = useMemo(() => activeDebts.filter(d => d.debt_type === 'owed_money'), [activeDebts]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openAddModal) {
      setSelectedDebt(null);
      setIsDebtModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const totalIOwe = oweDebts.reduce((sum, d) => sum + d.outstanding_balance, 0);
  const totalOwedToMe = owedDebts.reduce((sum, d) => sum + d.outstanding_balance, 0);

  const handleNodeClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPaymentModalOpen(true);
  };

  // Calculate layout (angles and radius)
  const renderNodes = (debtsArray: Debt[], isOwe: boolean) => {
    if (debtsArray.length === 0) return { nodes: [], tetherData: [] };
    
    // Owe goes to the bottom half (90 to 270 degrees)
    // Owed goes to the top half (-90 to 90 degrees)
    const baseAngleStart = isOwe ? 110 : -70;
    const baseAngleEnd = isOwe ? 250 : 70;
    const angleRange = baseAngleEnd - baseAngleStart;
    
    const nodes = debtsArray.map((debt, i) => {
      const step = debtsArray.length > 1 ? angleRange / (debtsArray.length - 1) : 0;
      const angle = debtsArray.length === 1 ? (isOwe ? 180 : 0) : baseAngleStart + (step * i);
      const radius = 120 + (i % 2 === 0 ? 0 : 40); // Stagger radius slightly
      
      return { debt, angle, radius };
    });
    
    return {
      nodes: nodes.map(n => (
        <ConstellationNode 
          key={n.debt.id} 
          debt={n.debt} 
          angle={n.angle} 
          radius={n.radius} 
          isOwe={isOwe}
          onClick={() => handleNodeClick(n.debt)}
        />
      )),
      tetherData: nodes
    };
  };

  const oweLayout = renderNodes(oweDebts, true);
  const owedLayout = renderNodes(owedDebts, false);

  return (
    <div className="h-screen w-full bg-[#000000] text-white overflow-hidden relative font-sans flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 md:p-10 z-30 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-4xl md:text-5xl font-outfit font-black tracking-tighter mb-1 drop-shadow-2xl">The Constellation</h1>
          <p className="text-gray-500 font-medium pointer-events-auto">Your financial orbit.</p>
        </div>
        <button 
          onClick={() => setIsDebtModalOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform pointer-events-auto"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Spatial Canvas */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center">
        
        <SvgTethers nodes={oweLayout.tetherData} isOweGroup={true} />
        <SvgTethers nodes={owedLayout.tetherData} isOweGroup={false} />

        {/* Central User Node */}
        <motion.div 
          className="relative z-30 flex flex-col items-center justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-[#18181B] border-4 border-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)] relative">
             <div className="absolute inset-0 rounded-full blur-2xl bg-white/10 -z-10" />
             <span className="font-outfit font-black text-3xl tracking-tighter">YOU</span>
          </div>
          
          <div className="absolute top-full mt-4 flex flex-col items-center w-64">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Net Balance</p>
            <p className={`font-outfit font-black text-3xl tracking-tighter ${totalOwedToMe >= totalIOwe ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-brand-orange drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}>
              {totalOwedToMe >= totalIOwe ? '+' : '-'}{formatINR(Math.abs(totalOwedToMe - totalIOwe))}
            </p>
          </div>
        </motion.div>

        {/* Orbiting Nodes */}
        {oweLayout.nodes}
        {owedLayout.nodes}

      </div>

      <DebtModal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        debtToEdit={selectedDebt}
      />
      <RecordPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        debt={selectedDebt} 
        onEdit={() => {
          setIsPaymentModalOpen(false);
          setIsDebtModalOpen(true);
        }}
      />
    </div>
  );
};

export default Debts;
