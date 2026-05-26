import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  route: string;
  description: string;
  language: string;
  onClose: () => void;
}

const CopilotNavigationCard: React.FC<Props> = ({ route, description, language, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    onClose();
    navigate(route);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-1 my-1"
    >
      <button
        onClick={handleNavigate}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-left hover:bg-primary/20 transition-colors"
      >
        <Navigation className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {language === 'am' ? 'ወደዚህ ይሂዱ →' : 'Go to this screen →'}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary" />
      </button>
    </motion.div>
  );
};

export default CopilotNavigationCard;
