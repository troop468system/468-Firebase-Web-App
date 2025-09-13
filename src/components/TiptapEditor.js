import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Box,
  ButtonGroup,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import googleDriveService from '../services/googleDriveService';

// Custom Image extension that handles missing images and delete functionality
const CustomImage = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      outingData: null,
    }
  },
  
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const container = document.createElement('span');
      container.style.cssText = `
        display: inline-block;
        position: relative;
        margin: 2px;
      `;
      
      const img = document.createElement('img');
      Object.assign(img, HTMLAttributes);
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.title = node.attrs.title || '';
      img.style.cssText = `
        max-width: 100%;
        height: auto;
        display: block;
      `;
      
      // Function to create delete button
      const createDeleteButton = () => {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = `
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background-color 0.2s;
        `;
        
        deleteBtn.addEventListener('mouseenter', () => {
          deleteBtn.style.background = 'rgba(220, 38, 38, 1)';
        });
        
        deleteBtn.addEventListener('mouseleave', () => {
          deleteBtn.style.background = 'rgba(239, 68, 68, 0.9)';
        });
        
        deleteBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          try {
            // Delete from Google Drive if it's a valid image
            if (node.attrs.src && !node.attrs.src.startsWith('blob:')) {
              await googleDriveService.deleteImage(node.attrs.src);
            }
            
            // Remove from editor
            if (typeof getPos === 'function') {
              const pos = getPos();
              editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
            }
          } catch (error) {
            console.error('Error deleting image:', error);
            // Still remove from editor even if Google Drive delete fails
            if (typeof getPos === 'function') {
              const pos = getPos();
              editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
            }
          }
        });
        
        return deleteBtn;
      };
      
      // Function to generate Google Drive path for tooltip
      const getGoogleDrivePath = (src, outingData) => {
        if (!src) return 'Unknown path';
        
        // Generate human-readable Google Drive path
        const generateHumanPath = (outingData, fileName) => {
          if (!outingData || !outingData.startDateTime || !outingData.eventName) {
            return '/Troop Manager/Images/';
          }
          
          // Format start date as YYYY-MM-DD
          const startDate = new Date(outingData.startDateTime);
          const formattedDate = startDate.toISOString().split('T')[0];
          
          // Clean event name for folder
          const cleanEventName = outingData.eventName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          return `/Troop Manager/Packets/${formattedDate}-${cleanEventName}/Images/`;
        };
        
        // Extract filename from alt text or generate generic name
        const fileName = node.attrs.alt || node.attrs.title || 'uploaded-image.jpg';
        
        // Get the human-readable folder path
        const folderPath = generateHumanPath(this.options.outingData, fileName);
        const fullPath = folderPath + fileName;
        
        return fullPath;
      };
      
      // Add delete button to working images (always show for working images)
      const deleteBtn = createDeleteButton();
      container.appendChild(deleteBtn);
      
      // Show delete button on hover
      container.addEventListener('mouseenter', () => {
        deleteBtn.style.display = 'flex';
      });
      
      container.addEventListener('mouseleave', () => {
        deleteBtn.style.display = 'none';
      });
      
      // Initially hide delete button
      deleteBtn.style.display = 'none';
      
      // Handle broken/missing images
      img.onerror = () => {
        console.log('Image failed to load, showing missing image token:', node.attrs.src);
        container.innerHTML = '';
        
        // Create missing image token
        const token = document.createElement('div');
        token.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          position: relative;
          cursor: help;
          max-width: 200px;
        `;
        
        // Warning icon (SVG)
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        `;
        icon.style.cssText = `
          flex-shrink: 0;
          display: flex;
          align-items: center;
        `;
        token.appendChild(icon);
        
        // Text
        const text = document.createElement('span');
        text.textContent = 'Missing image';
        text.style.cssText = `
          color: #92400e;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        token.appendChild(text);
        
        // Delete button for missing image token
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: none;
          background: #ef4444;
          color: white;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        `;
        
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Remove from editor
          if (typeof getPos === 'function') {
            const pos = getPos();
            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
          }
        });
        token.appendChild(deleteBtn);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #ffffff;
          color: #374151;
          padding: 12px;
          border-radius: 6px;
          font-size: 11px;
          z-index: 1000;
          display: none;
          min-width: 250px;
          max-width: 350px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          white-space: pre-line;
          font-family: 'Monaco', 'Menlo', monospace;
        `;
        
        // Create tooltip arrow
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #ffffff;
        `;
        
        const tooltipText = `📁 Google Drive Location:\n${getGoogleDrivePath(node.attrs.src, this.options.outingData)}\n\n🔧 Troubleshooting Steps:\n• Check if file exists in Google Drive\n• Verify permissions: "Anyone with link"\n• Confirm file is not deleted/moved\n• Try re-uploading the image`;
        tooltip.innerHTML = tooltipText.replace(/\n/g, '<br>');
        tooltip.appendChild(arrow);
        
        // Show/hide tooltip on hover
        token.addEventListener('mouseenter', () => {
          tooltip.style.display = 'block';
        });
        
        token.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
        
        container.appendChild(token);
        container.appendChild(tooltip);
      };
      
      // Start loading the image - add image first, then delete button
      container.appendChild(img);
      
      return {
        dom: container,
      };
    };
  },
});

const TiptapEditor = ({ 
  value = '', 
  onChange, 
  onBlur,
  placeholder = 'Start typing...',
  minHeight = '150px',
  disabled = false,
  outingData = null 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Exclude link from StarterKit to avoid duplicate
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    onBlur: ({ editor }) => {
      if (onBlur) {
        onBlur(editor.getHTML());
      }
    },
    editable: !disabled,
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Image must be smaller than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file');
        return;
      }

      setUploading(true);
      setUploadError(null);

      try {
        const imageUrl = await googleDriveService.uploadImage(file, null, outingData);
        
        if (editor) {
          editor.chain().focus().setImage({ 
            src: imageUrl,
            alt: file.name,
            title: file.name 
          }).run();
        }
      } catch (error) {
        console.error('Image upload failed:', error);
        setUploadError(error.message || 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return <Box sx={{ p: 2 }}>Loading editor...</Box>;
  }

  return (
    <Box className="tiptap-editor" sx={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: 2,
      backgroundColor: '#ffffff !important',
      '& .ProseMirror': {
        minHeight,
        padding: '12px',
        outline: 'none',
        backgroundColor: '#ffffff !important',
        color: '#000000 !important',
        '& p': {
          margin: '2px 0 !important',
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          margin: '8px 0 4px 0 !important',
          fontWeight: 600,
        },
        '& ul, & ol': {
          paddingLeft: '20px',
          margin: '4px 0 !important',
        },
        '& li': {
          margin: '2px 0 !important',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          margin: '4px 0',
        },
        '& a': {
          color: '#1976d2',
          textDecoration: 'underline',
        },
        '&:empty:before': {
          content: `"${placeholder}"`,
          color: '#999',
          pointerEvents: 'none',
        }
      }
    }}>
      {/* Toolbar */}
      <Box className="tiptap-toolbar" sx={{ 
        p: 1, 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#ffffff !important',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap'
      }}>
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bold">
            <IconButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive('bold') ? 'primary' : 'default'}
              size="small"
            >
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Italic">
            <IconButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive('italic') ? 'primary' : 'default'}
              size="small"
            >
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Underline">
            <IconButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              color={editor.isActive('underline') ? 'primary' : 'default'}
              size="small"
            >
              <UnderlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Bullet List">
            <IconButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive('bulletList') ? 'primary' : 'default'}
              size="small"
            >
              <BulletListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Numbered List">
            <IconButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              color={editor.isActive('orderedList') ? 'primary' : 'default'}
              size="small"
            >
              <NumberedListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Add Link">
          <IconButton onClick={addLink} size="small">
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Add Image">
          <IconButton 
            onClick={handleImageUpload} 
            size="small"
            disabled={uploading}
          >
            {uploading ? (
              <CircularProgress size={16} />
            ) : (
              <ImageIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Undo">
            <span>
              <IconButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                size="small"
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Redo">
            <span>
              <IconButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                size="small"
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Error Alert */}
      {uploadError && (
        <Alert 
          severity="error" 
          onClose={() => setUploadError(null)}
          sx={{ m: 1 }}
        >
          {uploadError}
        </Alert>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TiptapEditor;
