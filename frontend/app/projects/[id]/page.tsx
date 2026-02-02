"use client";
import { useEffect, useState } from "react";
import { getFile, storeProject, useAppDispatch, useAppSelector } from "@/store";
import { getProject } from "@/store";
import { addProject, setCurrentProject, updateProject } from "@/store/slices/projectsSlice";
import { rehydrate, setMediaFiles } from '@/store/slices/projectSlice';
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
import Image from "next/image";
import ProjectHeader from "@/components/editor/player/ProjectHeader";
import toast from "react-hot-toast";
import styles from "./page.module.css";
import videoIcon from "@/assets/images/video.svg";
import musicIcon from "@/assets/images/music.svg";
import imageIcon from "@/assets/images/image.svg";
import textIcon from "@/assets/images/text.svg";
import backIcon from "@/assets/images/back.svg";
import textSidebarIcon from "@/assets/images/text-sidebar.svg";
import mediaSidebarIcon from "@/assets/images/media-upload.svg";
import exportSidebarIcon from "@/assets/images/export.svg";
import { useRouter } from 'next/navigation'

export default function Project() {
    const params = useParams<{ id?: string | string[] }>();
    const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
    const dispatch = useAppDispatch();
    const router = useRouter();

    const projectState = useAppSelector((state) => state.projectState);
    const { currentProjectId } = useAppSelector((state) => state.projects);
    const [isLoading, setIsLoading] = useState(true);

    const { activeSection, activeElement } = projectState;
    useEffect(() => {
        const loadProject = async () => {
            if (id) {
                setIsLoading(true);
                const project = await getProject(id);
                if (project) {
                    dispatch(setCurrentProject(id));
                    setIsLoading(false);
                } else {
                    console.log(`Project not found: ${id}`);
                    handleCreateProject(id);
                    setIsLoading(false);
                }
            }
        };
        loadProject();
    }, [id, dispatch]);

    useEffect(() => {
        const loadProject = async () => {
            if (currentProjectId) {
                const project = await getProject(currentProjectId);
                if (project) {
                    dispatch(rehydrate(project));

                    dispatch(setMediaFiles(await Promise.all(
                        project.mediaFiles.map(async (media: MediaFile) => {
                            const file = await getFile(media.fileId);
                            return { ...media, src: URL.createObjectURL(file) };
                        })
                    )));
                }
            }
        };
        loadProject();
    }, [dispatch, currentProjectId]);

    useEffect(() => {
        const saveProject = async () => {
            if (!projectState || projectState.id != currentProjectId) return;
            await storeProject(projectState);
            dispatch(updateProject(projectState));
        };
        saveProject();
    }, [projectState, dispatch]);

    const handleCreateProject = async (id: string) => {
        const newProject: ProjectState = {
            id: id,
            projectName: "Untitled Project",
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            mediaFiles: [],
            textElements: [],
            currentTime: 0,
            isPlaying: false,
            isMuted: false,
            duration: 0,
            activeSection: 'media',
            activeElement: 'text',
            activeElementIndex: 0,
            filesID: [],
            zoomLevel: 1,
            timelineZoom: 100,
            enableMarkerTracking: true,
            resolution: { width: 1920, height: 1080 },
            fps: 30,
            aspectRatio: '16:9',
            history: [],
            future: [],
            exportSettings: {
                resolution: '1080p',
                quality: 'high',
                speed: 'fastest',
                fps: 30,
                format: 'mp4',
                includeSubtitles: false,
            },
        };

        await storeProject(newProject);
        dispatch(addProject(newProject));
        dispatch(setCurrentProject(id));
        console.log('Project created successfully');
        toast.success('Project created successfully');
    };

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
                <ProjectHeader />
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

        </div >
    );
}
