import { useState, useEffect } from 'react';
import Counter from '../Counter';

interface DashboardTabProps {
  isOpen: boolean;
}

export function DashboardTab({ isOpen }: DashboardTabProps) {
  const [arxivCount, setArxivCount] = useState<number>(0);
  const [quotaProgress, setQuotaProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    let countCurrent = 0;
    let quotaCurrent = 0;
    let active = true;

    // arXiv count-up animation logic (analog counter style)
    const runArxiv = () => {
      if (!active) return;
      if (countCurrent >= 1248) {
        setArxivCount(1248);
        return;
      }

      let delay = 16;
      let step = 1;

      if (countCurrent < 1200) {
        step = Math.min(25, 1200 - countCurrent);
        delay = 16;
      } else if (countCurrent < 1243) {
        step = 1;
        delay = 25;
      } else {
        step = 1;
        delay = 220; // decelerates extremely for the last 5 numbers
      }

      countCurrent += step;
      setArxivCount(countCurrent);
      setTimeout(runArxiv, delay);
    };

    // Daily Token Quota smooth progress fill logic (spring ease-out tail damping)
    const runQuota = () => {
      if (!active) return;
      if (quotaCurrent >= 42) {
        setQuotaProgress(42);
        return;
      }

      const remaining = 42 - quotaCurrent;
      let step = remaining * 0.15; // fast start, decay curve
      if (step < 0.1) step = 0.1;

      quotaCurrent += step;
      if (quotaCurrent >= 42) {
        quotaCurrent = 42;
      }
      setQuotaProgress(quotaCurrent);
      setTimeout(runQuota, 16); // 60fps updates
    };

    const startTimeout = setTimeout(() => {
      runArxiv();
      runQuota();
    }, 150); // slight offset for entering animation stability

    return () => {
      active = false;
      clearTimeout(startTimeout);
    };
  }, [isOpen]);

  return (
    <div className="tab-pane-content fade-in">
      <h2 className="tab-title">Research Dashboard</h2>
      <p className="tab-description">System telemetry and workspace academic integration analytics.</p>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>arXiv Core Indices</h3>
          <div className="card-metric">
            <Counter 
              value={arxivCount} 
              fontSize={30} 
              fontWeight={700}
              textColor="#ffffff"
              gradientHeight={4}
              gradientFrom="#020204"
            />
          </div>
          <p>Papers index-cached in this local workspace</p>
        </div>
        <div className="settings-card">
          <h3>INSPIRE-HEP API</h3>
          <div className="card-status active">Connected</div>
          <p>High Energy Physics records fully synchronized</p>
        </div>
        <div className="settings-card">
          <h3>Daily Token Quota</h3>
          <div className="quota-bar"><div className="quota-progress" style={{ width: `${quotaProgress}%` }}></div></div>
          <p>42,105 / 100,000 tokens used today</p>
        </div>
      </div>
    </div>
  );
}
