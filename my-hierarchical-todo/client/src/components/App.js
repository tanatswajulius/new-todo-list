/**
 * App.js
 * ------
 * Main application component.
 * 1. If user not logged in, show <Auth />.
 * 2. Otherwise, show the lists with drag-and-drop, 
 *    plus the form to create new lists, etc.
 */
import React, { useState, useEffect } from "react";
import Auth from "./auth";
import {
  fetchLists,
  createList,
  deleteList,
  moveItem
} from "../utils/api";
import List from "./List";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import "../styles/App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("userId"));
  const [lists, setLists] = useState({});
  const [newListTitle, setNewListTitle] = useState("");

  // If user is logged in, load data
  useEffect(() => {
    if (loggedIn) {
      loadLists();
    }
  }, [loggedIn]);

  async function loadLists() {
    const data = await fetchLists();
    if (data.error) {
      // possibly user is not authenticated
      alert(data.error);
      setLoggedIn(false);
      localStorage.removeItem("userId");
    } else {
      setLists(data);
    }
  }

  function onAuthSuccess() {
    setLoggedIn(true);
  }

  async function handleCreateList() {
    if (!newListTitle.trim()) return;
    const newList = await createList(newListTitle);
    if (!newList.error) {
      setLists((prev) => ({
        ...prev,
        [newList.id]: { ...newList, items: [] }
      }));
    }
    setNewListTitle("");
  }

  async function handleDeleteList(listId) {
    await deleteList(listId);
    setLists((prev) => {
      const newState = { ...prev };
      delete newState[listId];
      return newState;
    });
  }

  // React Beautiful DnD callback
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // If dropped in the same spot, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // source.droppableId => old parent ID (list.id or item.id)
    // destination.droppableId => new parent ID
    const targetParentId = destination.droppableId;
    let targetParentType = "item";

    // if droppableId matches one of our lists, it's a list
    if (lists[targetParentId]) {
      targetParentType = "list";
    }

    await moveItem(draggableId, targetParentType, targetParentId, destination.index);

    loadLists();
  };

  // If not logged in, show Auth
  if (!loggedIn) {
    return <Auth onAuthSuccess={onAuthSuccess} />;
  }

  // Otherwise, show the main ToDo interface
  return (
    <div className="app-container">
    <div className="main-content">
      <div className="header">
        <h1>The ToDo App</h1>
        <button
          onClick={() => {
            localStorage.removeItem("userId");
            setLoggedIn(false);
          }}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      <div className="create-list-form">
        <input
          type="text"
          value={newListTitle}
          placeholder="New List Title"
          onChange={(e) => setNewListTitle(e.target.value)}
          className="list-input"
        />
        <button onClick={handleCreateList} className="create-list-button">
          Create List
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="lists-container">
          {Object.values(lists).map((lst) => (
            <Droppable droppableId={lst.id} key={lst.id}>
              {(provided) => (
                <div
                  className="single-list-droppable"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <List list={lst} onDeleteList={handleDeleteList} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  </div>
  );
}

export default App;
