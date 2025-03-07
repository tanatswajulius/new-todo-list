/**
 * Item.js
 * -------
 * Renders a single item (which may have sub-items).
 * Allows editing content, marking complete, deleting, collapse/expand.
 * Also uses nested Droppable for sub-items, so sub-items can be dragged around.
 */
import React, { useState } from "react";
import { updateItem, deleteItem, createItem } from "../utils/api";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { FaTrashAlt, FaPlusCircle } from "react-icons/fa"; 
import "../styles/Item.css";

function Item({ item, parentType, parentId, depth = 0 }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [newSubItemContent, setNewSubItemContent] = useState("");

  // Toggle complete status
  async function handleComplete() {
    await updateItem(item.id, { complete: !item.complete });
    window.location.reload();
  }

  // If user finishes editing text
  async function handleContentBlur() {
    if (content.trim() && content !== item.content) {
      await updateItem(item.id, { content });
    }
    setEditing(false);
  }

  // Delete item entirely
  async function handleDelete() {
    await deleteItem(item.id);
    window.location.reload();
  }

  // Add a sub-item (only if depth < 2, so total 3 levels: 0->1->2)
  // Remove "depth < 2" to allow infinite nesting in the UI.
  // We'll obey the assignment's limit of 3 levels in the UI.
  const canAddSubItem = depth < 2;

  async function handleAddSubItem() {
    if (!newSubItemContent.trim()) return;
    await createItem("item", item.id, newSubItemContent);
    setNewSubItemContent("");
    window.location.reload();
  }

  return (
    <div
      className={`item-container ${item.complete ? "item-complete" : ""}`}
      style={{ marginLeft: depth * 20 }}
    >
      {/* Top row: complete checkbox, collapse button, content, delete */}
      <div className="item-header">
        <input 
          type="checkbox" 
          checked={item.complete} 
          onChange={handleComplete} 
          className="complete-checkbox"
        />
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="collapse-button">
          {isCollapsed ? "+" : "-"}
        </button>

        {editing ? (
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            autoFocus
            className="item-edit-input"
          />
        ) : (
          <span onClick={() => setEditing(true)} className="item-content">
            {content}
          </span>
        )}

        <button onClick={handleDelete} className="delete-item-button">
          <FaTrashAlt />
        </button>
      </div>

      {/* If not collapsed, show sub-items and add-sub-item form */}
      {!isCollapsed && (
        <div className="sub-item-section">
          {/* Droppable for sub-items so they can be dragged around */}
          <Droppable droppableId={item.id}>
            {(provided) => (
              <div
                className="sub-item-list"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {item.subItems?.map((sub, index) => (
                  <Draggable key={sub.id} draggableId={sub.id} index={index}>
                    {(provided2) => (
                      <div
                        ref={provided2.innerRef}
                        {...provided2.draggableProps}
                        {...provided2.dragHandleProps}
                      >
                        <Item
                          item={sub}
                          parentType="item"
                          parentId={item.id}
                          depth={depth + 1}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add sub-item form, if allowed by depth */}
          {canAddSubItem && (
            <div className="new-sub-item-form">
              <input
                type="text"
                value={newSubItemContent}
                placeholder="Add sub-item..."
                onChange={(e) => setNewSubItemContent(e.target.value)}
                className="sub-item-input"
              />
              <button onClick={handleAddSubItem} className="add-sub-item-button">
                <FaPlusCircle />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Item;
