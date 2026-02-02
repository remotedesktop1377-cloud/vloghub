import Image from "next/image";
import styles from "./SidebarButton.module.css";

export default function SidebarButton({ title, icon, onClick }: { title: string, icon: string, onClick: () => void }) {

    return (
        <button
            className={styles.button}
            onClick={onClick}
        >
            <Image
                alt={title}
                className={styles.icon}
                height={30}
                width={30}
                src={icon}
            />
            <span className={styles.label}>{title}</span>
        </button>
    );
}