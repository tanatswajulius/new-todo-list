"""
app.py
------
Defines the Flask application, routes for authentication (login/register),
and CRUD operations for lists and items. 
Ensures each user can only see/modify their own data.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from models import db, User, List, Item, generate_uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'some_super_secret_key'  # For sessions if needed

db.init_app(app)
CORS(app)

# Create tables if not exist
with app.app_context():
    db.create_all()

#####################################################
# HELPER: Get Current User from Request Headers
#####################################################
def get_current_user():
    """
    In a real app, you'd parse a session or JWT token.
    Here, we read a custom 'X-User-Id' header to identify the user.
    """
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return None
    user = User.query.get(user_id)
    return user
#####################################################
# HELLO WORLD
#####################################################
@app.route("/")
def hello():
    return jsonify({"message": "Hello, World!"})

#####################################################
# AUTHENTICATION ROUTES
#####################################################
@app.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user. 
    Validates email and password are provided and valid.
    Expects JSON: { "email": "...", "password": "..." }
    """
    data = request.json
    
    # Validate required fields
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400
        
    email = data["email"].strip()
    password = data["password"].strip()

    # Validate email and password are not empty
    if not email:
        return jsonify({"error": "Email cannot be blank"}), 400
    if not password:
        return jsonify({"error": "Password cannot be blank"}), 400
        
    # Validate minimum password length (optional)
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already taken"}), 400

    # Create new user
    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    """
    Log in a user.
    Expects JSON: { "email": "...", "password": "..." }
    Returns { "userId": ... } if successful.
    """
    data = request.json
    email = data["email"]
    password = data["password"]

    user = User.query.filter_by(email=email).first()
    if not user or user.password != password:
        return jsonify({"error": "Invalid credentials"}), 401

    # Return the user's ID (in a real app you'd return a JWT or session token)
    return jsonify({"userId": user.id}), 200

#####################################################
# LIST ROUTES
#####################################################
@app.route("/api/lists", methods=["GET"])
def get_lists():
    """
    Get all lists for the current logged-in user.
    Returns { list_id: { ... }, ... }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    lists = List.query.filter_by(user_id=user.id).all()
    response = {}
    for lst in lists:
        response[lst.id] = {
            "id": lst.id,
            "title": lst.title,
            "items": build_items_hierarchy(lst.items)
        }
    return jsonify(response), 200

def build_items_hierarchy(items):
    """
    Build a nested structure from top-level items 
    (those whose parent_item_id is None).
    """
    top_level = [i for i in items if i.parent_item_id is None]
    return [build_item_dict(item) for item in top_level]

def build_item_dict(item):
    """Recursively convert an Item object to a dictionary with sub-items."""
    return {
        "id": item.id,
        "content": item.content,
        "complete": item.complete,
        "subItems": [build_item_dict(sub) for sub in item.sub_items]
    }

@app.route("/api/lists", methods=["POST"])
def create_list():
    """
    Create a new list for the current user.
    Expects JSON: { "title": "..." }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    title = data.get("title", "Untitled List")

    new_list = List(title=title, user_id=user.id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({
        "id": new_list.id,
        "title": new_list.title,
        "items": []
    }), 201

@app.route("/api/lists/<list_id>", methods=["PUT"])
def update_list(list_id):
    """
    Rename an existing list, if owned by the current user.
    Expects JSON: { "title": "..." }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    lst = List.query.filter_by(id=list_id, user_id=user.id).first()
    if not lst:
        return jsonify({"error": "List not found or not yours"}), 404

    data = request.json
    lst.title = data.get("title", lst.title)
    db.session.commit()
    return jsonify({"id": lst.id, "title": lst.title}), 200

@app.route("/api/lists/<list_id>", methods=["DELETE"])
def delete_list(list_id):
    """
    Delete a list, if owned by current user.
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    lst = List.query.filter_by(id=list_id, user_id=user.id).first()
    if not lst:
        return jsonify({"error": "List not found or not yours"}), 404

    db.session.delete(lst)
    db.session.commit()
    return jsonify({"message": "List deleted"}), 200

#####################################################
# ITEM ROUTES
#####################################################
@app.route("/api/items", methods=["POST"])
def create_item():
    """
    Create a new item for the current user, 
    either under a list (parentType = 'list') 
    or another item (parentType = 'item').
    Expects JSON: {
      "parentType": "list" or "item",
      "parentId": "...",
      "content": "..."
    }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    parent_type = data.get("parentType")
    parent_id = data.get("parentId")
    content = data.get("content", "")

    new_item = Item(content=content, user_id=user.id)

    if parent_type == "list":
        parent_list = List.query.filter_by(id=parent_id, user_id=user.id).first()
        if not parent_list:
            return jsonify({"error": "List not found or not yours"}), 404
        new_item.parent_list_id = parent_list.id
    elif parent_type == "item":
        parent_item = Item.query.filter_by(id=parent_id, user_id=user.id).first()
        if not parent_item:
            return jsonify({"error": "Item not found or not yours"}), 404
        new_item.parent_item_id = parent_item.id
    else:
        return jsonify({"error": "Invalid parentType"}), 400

    db.session.add(new_item)
    db.session.commit()
    return jsonify({
        "id": new_item.id,
        "content": new_item.content,
        "complete": new_item.complete,
        "subItems": []
    }), 201

@app.route("/api/items/<item_id>", methods=["PUT"])
def update_item(item_id):
    """
    Update an existing item, if it belongs to the current user.
    Can be used to edit content or mark as complete.
    Expects JSON: { "content": "...", "complete": bool }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Item not found or not yours"}), 404

    data = request.json
    # update content
    if "content" in data:
        item.content = data["content"]
    # mark complete / incomplete
    if "complete" in data:
        item.complete = bool(data["complete"])

    db.session.commit()
    return jsonify({
        "id": item.id,
        "content": item.content,
        "complete": item.complete
    }), 200

@app.route("/api/items/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    """
    Delete an item if it belongs to the current user.
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Item not found or not yours"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted"}), 200

@app.route("/api/items/move", methods=["POST"])
def move_item():
    """
    Move an item from its current parent to a new parent (list or item).
    Expects JSON: {
      "itemId": "...",
      "targetParentType": "list" or "item",
      "targetParentId": "...",
      "targetIndex": int (optional)
    }
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    item_id = data["itemId"]
    target_type = data["targetParentType"]
    target_id = data["targetParentId"]
    # target_index = data.get("targetIndex") # not fully implemented here

    item = Item.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({"error": "Item not found or not yours"}), 404

    if target_type == "list":
        lst = List.query.filter_by(id=target_id, user_id=user.id).first()
        if not lst:
            return jsonify({"error": "Target list not found or not yours"}), 404
        item.parent_list_id = lst.id
        item.parent_item_id = None
    elif target_type == "item":
        parent_item = Item.query.filter_by(id=target_id, user_id=user.id).first()
        if not parent_item:
            return jsonify({"error": "Target item not found or not yours"}), 404
        item.parent_list_id = None
        item.parent_item_id = parent_item.id
    else:
        return jsonify({"error": "Invalid target parent type"}), 400

    db.session.commit()
    return jsonify({"message": "Item moved successfully"}), 200

if __name__ == "__main__":
    app.run(debug=True)
