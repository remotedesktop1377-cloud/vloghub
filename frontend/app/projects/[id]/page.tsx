"use client";
import { useEffect, useRef, useState } from "react";
import { getFile, storeProject, useAppDispatch, useAppSelector } from "@/store";
import { getProject } from "@/store";
import { addProject, setCurrentProjectId, updateProject } from "@/store/slices/projectsSlice";
import { rehydrate, setAutoRenderProjectId, setAutoRenderRequested, setMediaFiles } from '@/store/slices/projectSlice';
import { setActiveSection } from "@/store/slices/projectSlice";
import AddText from '@/components/editor/AssetsPanel/tools-section/AddText';
import AddMedia from '@/components/editor/AssetsPanel/AddButtons/UploadMedia';
import MediaList from '@/components/editor/AssetsPanel/tools-section/MediaList';
import { useParams } from 'next/navigation';
import SidebarButton from "@/components/editor/AssetsPanel/SidebarButtons/SidebarButton";
import MediaProperties from "@/components/editor/PropertiesSection/MediaProperties";
import TextProperties from "@/components/editor/PropertiesSection/TextProperties";
import { Timeline } from "@/components/editor/timeline/Timline";
import { PreviewPlayer } from "@/components/editor/player/remotion/Player";
import { MediaFile, ProjectState } from "@/types/video_editor";
import ExportList from "@/components/editor/AssetsPanel/tools-section/ExportList";
import Ffmpeg from "@/components/editor/render/Ffmpeg/Ffmpeg";
import Image from "next/image";
import ProjectHeader from "@/components/editor/player/ProjectHeader";
import toast from "react-hot-toast";
import styles from "./page.module.css";
import videoIcon from "@/assets/images/video.svg";
import musicIcon from "@/assets/images/music.svg";
import imageIcon from "@/assets/images/image.svg";
import textIcon from "@/assets/images/text.svg";
import textSidebarIcon from "@/assets/images/text-sidebar.svg";
import mediaSidebarIcon from "@/assets/images/media-upload.svg";
import exportSidebarIcon from "@/assets/images/export.svg";
import { HelperFunctions, SecureStorageHelpers } from "@/utils/helperFunctions";

export default function Project() {
    const params = useParams<{ id?: string | string[] }>();
    const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
    const dispatch = useAppDispatch();

    const projectState = useAppSelector((state) => state.projectState);
    const { currentProjectId } = useAppSelector((state) => state.projects);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedProject, setHasLoadedProject] = useState(false);
    const isCreatingProjectRef = useRef(false);

    const { activeSection, activeElement } = projectState;

    useEffect(() => {
        const loadProject = async () => {
            if (id) {
                debugger;
                setIsLoading(true);
                dispatch(setCurrentProjectId(id));
                const project = await getProject(id);
                if (project) {
                    console.log(`Project exist: ${id}`);
                    handleBuildProject(project);
                } else {
                    console.log(`Project not found: ${id}`);
                    const newProject = await handleCreateProject(id);
                    if (newProject) {
                        handleBuildProject(newProject);
                    }
                }
            }
        };
        loadProject();
    }, [id]);

    const handleBuildProject = async (project: ProjectState) => {
        debugger;
        if (project) {
            dispatch(rehydrate(project));
            dispatch(setCurrentProjectId(project.id));
            dispatch(setMediaFiles(await Promise.all(
                project.mediaFiles.map(async (media: MediaFile) => {
                    if (media.src) {
                        return media;
                    }
                    if (!media.fileId) {
                        return media;
                    }
                    const file = await getFile(media.fileId);
                    if (!file) {
                        return media;
                    }
                    return { ...media, src: URL.createObjectURL(file) };
                })
            )));
        }
        setHasLoadedProject(true);
        setIsLoading(false);
    }

    const handleCreateProject = async (id: string) => {
        if (isCreatingProjectRef.current) {
            return;
        }
        isCreatingProjectRef.current = true;
        const scriptMetadata = SecureStorageHelpers.getScriptMetadata();
        if (!scriptMetadata) {
            isCreatingProjectRef.current = false;
            return;
        }
        const newProject = HelperFunctions.createProjectFromScriptMetadata(id, scriptMetadata);
        if (!newProject) {
            isCreatingProjectRef.current = false;
            return;
        }

        debugger;

        await storeProject(newProject);
        dispatch(addProject(newProject));
        dispatch(setActiveSection("export"));
        dispatch(setAutoRenderRequested(true));
        dispatch(setAutoRenderProjectId(id));

        if (!scriptMetadata?.projectCreatedToastShown) {
            console.log('Project created successfully');
            toast.success('Project created successfully');
        }

        isCreatingProjectRef.current = false;
        return newProject;
    };

    useEffect(() => {
        const saveProject = async () => {
            if (!hasLoadedProject || !projectState || projectState?.id != currentProjectId) return;
            await storeProject(projectState);
            dispatch(updateProject(projectState));
        };
        saveProject();
    }, [projectState, dispatch, currentProjectId, hasLoadedProject]);

    const handleFocus = (section: "media" | "text" | "export") => {
        dispatch(setActiveSection(section));
    };

    return (
        <div className={styles.page}>
            {
                isLoading ? (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingCard}>
                            <div className={styles.spinner}></div>
                            <p className={styles.loadingText}>Loading project...</p>
                        </div>
                    </div>
                ) : null
            }
            <div className={styles.projectName}>
                <ProjectHeader currentProjectId={currentProjectId!} />
            </div>
            <div className={styles.main}>

                <div className={styles.sidebarLeft}>
                    <div className={styles.sidebarButtons}>
                        <SidebarButton title="Text" icon={textSidebarIcon} onClick={() => handleFocus("text")} />
                        <SidebarButton title="Media" icon={mediaSidebarIcon} onClick={() => handleFocus("media")} />
                        <SidebarButton title="Export" icon={exportSidebarIcon} onClick={() => handleFocus("export")} />
                    </div>
                </div>

                <div className={styles.sidebarPanel}>
                    {activeSection === "media" && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.panelTitle}>
                                <AddMedia />
                            </h2>
                            <MediaList />
                        </div>
                    )}
                    {activeSection === "text" && (
                        <div className={styles.sectionCard}>
                            <AddText />
                        </div>
                    )}
                    {activeSection === "export" && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.panelTitle}>Export</h2>
                            <ExportList />
                        </div>
                    )}
                </div>

                <div className={styles.center}>

                    <div className={styles.playerArea}>
                        <div className={styles.playerSizer}>
                            <PreviewPlayer />
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    {activeElement === "media" && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.panelTitle}>Media Properties</h2>
                            <MediaProperties />
                        </div>
                    )}
                    {activeElement === "text" && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.panelTitle}>Text Properties</h2>
                            <TextProperties />
                        </div>
                    )}
                </div>

            </div>

            <div className={styles.timelineRow}>
                <div className={styles.iconRail}>
                    <div className={styles.iconButton}>
                        <Image alt="Video" className={styles.icon} height={20} width={20} src={videoIcon} />
                    </div>
                    <div className={styles.iconButton}>
                        <Image alt="Audio" className={styles.icon} height={20} width={20} src={musicIcon} />
                    </div>
                    <div className={styles.iconButton}>
                        <Image alt="Image" className={styles.icon} height={20} width={20} src={imageIcon} />
                    </div>
                    <div className={styles.iconButton}>
                        <Image alt="Text" className={styles.icon} height={20} width={20} src={textIcon} />
                    </div>
                </div>
                <div className={styles.timelineContent}>
                    <Timeline />
                </div>
            </div>
            <div style={{ display: "none" }}>
                <Ffmpeg />
            </div>

        </div >
    );
}
