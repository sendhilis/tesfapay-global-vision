import React from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Loader2 } from 'lucide-react';

interface Props {
  onRequestBriefing: () => void;
  isLoading: boolean;
  language: string;
}

const CopilotBriefing: React.FC<Props> = ({ onRequestBriefing, isLoading, language }) => (
  <motion.button
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onRequestBriefing}
    disabled={isLoading}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left hover:from-amber-500/20 hover:to-orange-500/20 transition-all disabled:opacity-50"
  >
    {isLoading ? (
      <Loader2 className="h-5 w-5 text-amber-500 animate-spin flex-shrink-0" />
    ) : (
      <Sunrise className="h-5 w-5 text-amber-500 flex-shrink-0" />
    )}
    <div>
      <p className="text-sm font-semibold text-foreground">
        {language === 'am' ? '☀️ ዛሬ ምን አለ?' : '☀️ Good morning brief'}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {language === 'am' ? 'ሂሳብ፣ ብድር እና ማሳወቂያ ማጠቃለያ' : 'Account, loans & alerts summary'}
      </p>
    </div>
  </motion.button>
);

export default CopilotBriefing;
