/**
 * List.js
 * -------
 * Renders a single list. Allows renaming (inline), 
 * deleting, and adding top-level items.
 * Each top-level item is draggable (Draggable).
 */
import React, { useState } from "react";
import Item from "./Item";
import { updateList, createItem } from "../utils/api";
import { Draggable } from "react-beautiful-dnd";
import { FaTrashAlt, FaPlusCircle } from "react-icons/fa"; 
import "../styles/List.css";

const List = ({ list, onDeleteList }) => {
  const [title, setTitle] = useState(list.title);
  const [editing, setEditing] = useState(false);
  const [newItemContent, setNewItemContent] = useState("");

  async function handleTitleBlur() {
    // if user changed the title, update on server
    if (title.trim() && title !== list.title) {
      await updateList(list.id, title);
    }
    setEditing(false);
  }

  async function handleAddItem() {
    // create a new top-level item
    if (!newItemContent.trim()) return;
    await createItem("list", list.id, newItemContent);
    setNewItemContent("");
    window.location.reload();
  }

  return (
    <div className="list-container">
      <div className="list-header">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            autoFocus
            className="list-title-input"
          />
        ) : (
          <h2 onClick={() => setEditing(true)} className="list-title">
            {title}
          </h2>
        )}
        <button onClick={() => onDeleteList(list.id)} className="delete-list-button">
          <FaTrashAlt />
        </button>
      </div>

      <div className="new-item-form">
        <input
          type="text"
          value={newItemContent}
          placeholder="Add new item..."
          onChange={(e) => setNewItemContent(e.target.value)}
          className="item-input"
        />
        <button onClick={handleAddItem} className="add-item-button">
          <FaPlusCircle />
        </button>
      </div>

      {/* Render top-level items as Draggables */}
      {list.items?.map((item, index) => (
        <Draggable key={item.id} draggableId={item.id} index={index}>
          {(provided) => (
            <div
              className="draggable-item-wrapper"
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <Item
                item={item}
                parentType="list"
                parentId={list.id}
              />
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );
};

export default List;
