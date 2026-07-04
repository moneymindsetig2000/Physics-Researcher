import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ShinyText from './ShinyText';

const sentences = [
  "Calculating the universe",
  "Solving quantum equations",
  "Warping spacetime",
  "Counting the stars",
  "Measuring the Planck length",
  "Chasing the Higgs boson",
  "Mapping dark matter",
  "Decoding the cosmos",
  "Crunching black hole data",
  "Simulating supernovae",
  "Quantizing gravity",
  "Tracing gravitational waves",
  "Exploring the multiverse",
  "Computing the fine-structure constant",
  "Analyzing cosmic background radiation",
  "Unraveling quantum entanglement",
  "Charting the observable universe",
  "Colliding particles at light speed"
];

const ThinkingLoader: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % sentences.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ShinyText text={sentences[index]} />
      </motion.div>
    </AnimatePresence>
  );
};

export default ThinkingLoader;
