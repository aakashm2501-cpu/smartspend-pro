import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Target, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversalAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalAddSheet: React.FC<UniversalAddSheetProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Expense', icon: <ArrowDownCircle size={32} className="text-white" />, color: 'from-orange-500 to-red-600', route: '/transactions', state: { openAddModal: true, defaultType: 'expense' } },
    { label: 'Income', icon: <ArrowUpCircle size={32} className="text-white" />, color: 'from-emerald-400 to-teal-600', route: '/transactions', state: { openAddModal: true, defaultType: 'income' } },
    { label: 'Debt', icon: <Users size={32} className="text-white" />, color: 'from-amber-400 to-orange-500', route: '/debts', state: { openAddModal: true } },
    { label: 'Bill', icon: <CalendarClock size={32} className="text-white" />, color: 'from-blue-400 to-indigo-600', route: '/plan', state: { openAddModal: true, defaultType: 'bill' } },
    { label: 'Goal', icon: <Target size={32} className="text-white" />, color: 'from-purple-400 to-fuchsia-600', route: '/plan', state: { openAddModal: true, defaultType: 'goal' } },
  ];

  // Calculate radial positions for 5 items
  // Radius from the bottom center (thumb)
  const radius = 120;
  // Angles from 180 to 360 (top half circle)
  // Actually, since it's bottom center, angles should be from like 190 to 350 degrees
  // In DOM coords, 0 is right, 90 is down, 180 is left, 270 is up
  // Let's use 190 to 350
  
  const getPosition = (index: number, total: number) => {
    const startAngle = 190;
    const endAngle = 350;
    const angle = startAngle + ((endAngle - startAngle) / (total - 1)) * index;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden pointer-events-auto">
          
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-black/60" 
            onClick={onClose}
          />
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center w-0 h-0 pointer-events-none">
            {/* Action Nodes */}
            {actions.map((action, i) => {
              const pos = getPosition(i, actions.length);
              
              return (
                <motion.div
                  key={action.label}
                  className="absolute pointer-events-auto flex flex-col items-center justify-center group"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
                  exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25, 
                    delay: i * 0.05 
                  }}
                  style={{ marginLeft: -32, marginTop: -32 }} // half width
                >
                  <button 
                    onClick={() => {
                      onClose();
                      navigate(action.route, { state: action.state });
                    }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-90 transition-transform`}
                  >
                    {action.icon}
                  </button>
                  <span className="text-sm mt-3 font-outfit font-bold text-white tracking-wide opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                </motion.div>
              );
            })}

            {/* Central Close Button (Replaces FAB) */}
            <motion.button
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              onClick={onClose}
              className="absolute pointer-events-auto w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] z-50 ml-[-32px] mt-[-32px] active:scale-90 transition-transform"
            >
              <X size={32} strokeWidth={3} />
            </motion.button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
