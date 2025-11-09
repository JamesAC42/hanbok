"use client";

import styles from "@/styles/components/Dashboard.module.scss";
import Sidebar from "./Sidebar";
import DashboardTopNav from "./DashboardTopNav";

const Dashboard = ({ children }) => {
    return (
        <div className={styles.dashboard}>
            <Sidebar />
            <div className={styles.main}>
                <DashboardTopNav />
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
