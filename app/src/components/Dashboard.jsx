import styles from "@/styles/components/Dashboard.module.scss";
import Sidebar from "./Sidebar";

const Dashboard = ({children}) => {
    return (
        <div className={styles.dashboard}>
            <Sidebar />
            {children}
        </div>
    )
}

export default Dashboard;