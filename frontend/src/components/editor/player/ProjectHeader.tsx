"use client";
import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch, deleteProject } from "../../../store";
import { setProjectName } from "../../../store/slices/projectSlice";
import SidebarButton from "../AssetsPanel/SidebarButtons/SidebarButton";
import backIcon from "@/assets/images/back.svg";
import { useRouter } from "next/navigation";
import styles from "./ProjectHeader.module.css";
import BackConfirmationDialog from "@/dialogs/BackConfirmationDialog";
import { cleanupService } from "@/services/cleanupService";

export default function ProjectHeader({ currentProjectId }: { currentProjectId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isBackDialogOpen, setIsBackDialogOpen] = useState(false);
    const { projectName } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setProjectName(e.target.value));
    };

    const handleBackClick = () => {
        setIsBackDialogOpen(true);
    };

    const handleBackClose = () => {
        setIsBackDialogOpen(false);
    };

    const handleBackConfirm = async () => {
        setIsBackDialogOpen(false);
        await deleteProject(currentProjectId);
        try {
            await cleanupService.cleanupExports();
        } catch {
        }
        router.back();
    };

    return (
        <div className={styles.header}>
            <SidebarButton title="" icon={backIcon} onClick={handleBackClick} />
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={projectName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={styles.input}
                    autoFocus
                />
            ) : (
                <p
                    onClick={handleClick}
                    className={styles.title}
                >
                    {projectName}
                    <svg className={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                </p>
            )}
            <BackConfirmationDialog
                open={isBackDialogOpen}
                onClose={handleBackClose}
                onConfirm={handleBackConfirm}
                title="Are you sure?"
                message="Your changes will not be saved."
                confirmText="Discard Changes"
                cancelText="Cancel"
            />
        </div>
    );
}