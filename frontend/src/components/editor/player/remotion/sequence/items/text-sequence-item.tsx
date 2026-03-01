import { TextElement } from "../../../../../../types/video_editor";
import { HelperFunctions } from "../../../../../../utils/helperFunctions";
import { useAppDispatch, useAppSelector } from "../../../../../../store";
import { setTextElements } from "../../../../../../store/slices/projectSlice";
import { Sequence } from "remotion";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    // Round to integers to prevent floating-point precision issues
    // Remotion Sequence is sensitive to prop changes and expects integer frame numbers
    return { 
        from: Math.round(from), 
        durationInFrames: Math.round(durationInFrames) 
    };
};

export const TextSequenceItem: React.FC<{ item: TextElement; options: SequenceItemOptions }> = ({ item, options }) => {
    const { handleTextChange, fps, editableTextId } = options;
    const dispatch = useAppDispatch();
    const { textElements, resolution } = useAppSelector((state) => state.projectState);

    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const onUpdateText = (id: string, updates: Partial<TextElement>) => {
        dispatch(setTextElements(textElements.map(text =>
            text.id === id ? { ...text, ...updates } : text
        )));
    };

    // TODO: Extract this logic to be reusable for other draggable items
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only handle left mouse button
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;

        // TODO: This needs a more reliable way to get the scaled container
        const container = document.querySelector('.__remotion-player') as HTMLElement;
        const rect = container?.getBoundingClientRect();
        const scaleX = rect && container?.offsetWidth ? rect.width / container.offsetWidth : 1;
        const scaleY = rect && container?.offsetHeight ? rect.height / container.offsetHeight : 1;

        const handleMouseMove = (e: MouseEvent) => {
            const diffX = e.clientX - startX;
            const diffY = e.clientY - startY;
            onUpdateText(item.id, { x: safeX + diffX / scaleX, y: safeY + diffY / scaleY });

            // handleTextChange fonksiyonu varsa pozisyon güncellemesini bildir
            if (handleTextChange) {
                // Burada pozisyon değişikliğini parent component'e bildirebiliriz
                // handleTextChange(item.id, `position:${newX},${newY}`);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // TODO: add more options for text
    const safeWidth = HelperFunctions.getValidNumber(item.width) ?? 3000;
    const safeHeight = HelperFunctions.getValidNumber(item.height) ?? 400;
    const safeX = HelperFunctions.getValidNumber(item.x) ?? 0;
    const safeY = HelperFunctions.getValidNumber(item.y) ?? 0;
    const safeFontSize = HelperFunctions.getValidNumber(item.fontSize);
    const safeOpacity = HelperFunctions.getValidNumber(item.opacity);

    return (
        <Sequence
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: "none" }}
        >
            <TransitionSeries>
                <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: 30 })} />
                <TransitionSeries.Sequence
                    durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                    className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text `}
                    data-track-item="transition-element"
                    style={{
                        position: "absolute",
                        width: safeWidth,
                        height: safeHeight,
                        fontSize: safeFontSize ?? "16px",
                        top: safeY,
                        left: safeX,
                        color: item.color || "#000000",
                        zIndex: 1000,
                        // backgroundColor: item.backgroundColor || "transparent",
                        opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                        fontFamily: item.font || "Arial",
                        pointerEvents: "auto",
                    }}
                >
                    <div
                        data-text-id={item.id}
                        style={{
                            height: "100%",
                            boxShadow: "none",
                            outline: "none",
                            whiteSpace: "normal",
                            backgroundColor: item.backgroundColor || "transparent",
                            position: "relative",
                            width: "100%",
                            cursor: "move",
                        }}
                        onMouseDown={handleMouseDown}
                        // onMouseMove={handleMouseMove}
                        // onMouseUp={handleMouseUp}
                        dangerouslySetInnerHTML={{ __html: item.text }}
                        className="designcombo_textLayer"
                    />
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition timing={springTiming({ config: { damping: 200 } })} presentation={fade()} />
            </TransitionSeries>
        </Sequence>
    );
};