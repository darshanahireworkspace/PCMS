import { motion } from "framer-motion";
import policeLogo from "../assets/police-logo.png";

function SplashScreen() {
  return (
    <div className="splash-screen">

      <motion.img
        src={policeLogo}
        alt="Police Logo"
        className="splash-logo"
        initial={{ scale: .4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: .8 }}
      />

      <motion.h1
        className="splash-title"
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: .4 }}
      >
        Chhavani Police Station
      </motion.h1>

      <motion.h3
        className="splash-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: .8 }}
      >
        Police City Management System
      </motion.h3>

      <motion.div
        className="loading-line"
        initial={{ width: 0 }}
        animate={{ width: "170px" }}
        transition={{ duration: 2 }}
      />

      <p className="loading-text">
        Loading Secure Police Portal...
      </p>

    </div>
  );
}

export default SplashScreen;