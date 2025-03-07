"""
models.py
---------
Contains SQLAlchemy database models for User, List, and Item. 
Defines relationships for hierarchical items and user ownership.
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey, Boolean
import uuid

db = SQLAlchemy()

def generate_uuid():
    """Generate a unique UUID string for primary keys."""
    return str(uuid.uuid4())

class User(db.Model):
    """Represents a user, who can own multiple lists and items."""
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    lists = relationship("List", back_populates="owner", cascade="all, delete-orphan")

class List(db.Model):
    """Represents a top-level list. Each list is owned by a specific user."""
    __tablename__ = 'lists'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(200), nullable=False)

    # user ownership
    user_id = db.Column(db.String(36), ForeignKey('users.id'), nullable=False)
    owner = relationship("User", back_populates="lists", foreign_keys=[user_id])

    # items in this list
    items = relationship("Item", back_populates="parent_list", cascade="all, delete-orphan")

class Item(db.Model):
    """
    Represents a todo item, which can belong to a List (if top-level)
    or to another Item (if it's a sub-item).
    Can have sub-items of its own, enabling infinite nesting.
    """
    __tablename__ = 'items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    content = db.Column(db.String(500), nullable=False)
    complete = db.Column(db.Boolean, default=False)

    user_id = db.Column(db.String(36), ForeignKey('users.id'), nullable=False)
    parent_list_id = db.Column(db.String(36), ForeignKey('lists.id'), nullable=True)
    parent_item_id = db.Column(db.String(36), ForeignKey('items.id'), nullable=True)

    parent_list = relationship("List", back_populates="items", foreign_keys=[parent_list_id])
    parent_item = relationship("Item", remote_side=[id], back_populates="sub_items")

    # sub-items
    sub_items = relationship("Item", back_populates="parent_item", cascade="all, delete-orphan")
