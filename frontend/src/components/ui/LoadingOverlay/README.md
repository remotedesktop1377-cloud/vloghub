# LoadingOverlay Component

A reusable loading overlay component that provides a full-screen loading experience with touch disable functionality for AI operations.

## Features

- 🚫 **Complete Touch Disable**: Blocks all touch, click, and interaction events
- 🎨 **Professional Design**: Semi-transparent overlay with animated loading elements
- 🔄 **Dynamic Messages**: Context-aware loading messages for different operations
- 📱 **Mobile Optimized**: Cross-browser compatibility with touch event handling
- 🎭 **Smooth Animations**: Pulsing spinner and fading text effects
- 🚀 **Smart Navigation**: Automatically scrolls to relevant sections for suggestions API calls

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `generatingSceneData` | `boolean` | `false` | Shows "Generating Script" message |
| `enhancingDetails` | `boolean` | `false` | Shows "Enhancing Topic Details" message |
| `enhancingHypothesis` | `boolean` | `false` | Shows "Enhancing Hypothesis" message |
| `imagesLoading` | `boolean` | `false` | Shows "Generating Images" message |
| `pickerLoading` | `boolean` | `false` | Shows "Generating Narration Variations" message |

## Usage

```tsx
import LoadingOverlay from '../LoadingOverlay';

// In your component
<LoadingOverlay
  generatingSceneData={generatingSceneData}
  loadingTopicSuggestions={loadingTopicSuggestions}
  imagesLoading={imagesLoading}
  // ... other loading states
/>
```

## CSS Module Import

The component automatically imports its CSS Module:

```tsx
import styles from './LoadingOverlay.module.css';
```

## CSS Classes

The component uses CSS Modules with the following class names:

- `.loadingOverlay`: Main overlay container
- `.loadingCard`: White loading card
- `.loadingSpinner`: Animated spinner
- `.loadingTitle`: Animated title text

**Note**: CSS Modules automatically scope these classes to prevent conflicts, so no custom prefix is needed.

## Touch Disable Features

- **Click Events**: `onClick` prevented with `preventDefault()`
- **Touch Events**: `onTouchStart`, `onTouchMove`, `onTouchEnd` prevented
- **User Selection**: `userSelect: 'none'` across all browsers
- **Touch Actions**: `touchAction: 'none'` for mobile devices
- **Pointer Events**: `pointerEvents: 'auto'` to capture interactions

## Smart Navigation Behavior

The component automatically handles navigation for different types of operations:

- **Topic Suggestions**: Automatically scrolls to "Your Topic" section
- **Hypothesis Suggestions**: Automatically scrolls to "Your Hypothesis" section
- **Explore Topic Button**: Automatically scrolls to "Your Topic" section when clicked
- **No Loading Overlay**: Suggestions API calls don't show loading overlay
- **Smooth Scrolling**: Uses smooth scroll behavior for better UX
- **User Control**: Clicking on individual suggestions does NOT automatically navigate

## Browser Support

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox (Mozilla)
- ✅ Safari (Webkit)
- ✅ Internet Explorer (Microsoft)
- ✅ Mobile browsers

## Animation Details

- **Spinner Pulse**: 2-second opacity animation
- **Title Fade**: 3-second opacity animation
- **Smooth Transitions**: CSS keyframes for performance 