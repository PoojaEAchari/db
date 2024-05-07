from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)

# Connect to MySQL database
mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="groceries_list"
)

# Create cursor
mycursor = mydb.cursor()

# Create table if not exists
mycursor.execute("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), quantity INT, unit VARCHAR(50), date DATE)")

# Define routes
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to get all items
@app.route('/items', methods=['GET'])
def get_items():
    mycursor.execute("SELECT * FROM items")
    items = mycursor.fetchall()
    return jsonify(items)

# API endpoint to add an item with date
@app.route('/items', methods=['POST'])
def add_item():
    name = request.json['name']
    quantity_string = request.json['quantity']  # Get quantity string
    quantity, unit = quantity_string.split()  # Split quantity and unit
    date = request.json['date']  # Get date
    mycursor.execute("INSERT INTO items (name, quantity, unit, date) VALUES (%s, %s, %s, %s)", (name, quantity, unit, date))  # Insert unit into database
    mydb.commit()
    return jsonify({'message': 'Item added successfully'})

# API endpoint to get all items by date
@app.route('/items/<date>', methods=['GET'])
def get_items_by_date(date):
    mycursor.execute("SELECT * FROM items WHERE date = %s", (date,))
    items = mycursor.fetchall()
    return jsonify(items)

# API endpoint to update an item
@app.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    name = request.json['name']
    quantity_string = request.json['quantity']  # Get quantity string
    quantity, unit = quantity_string.split()  # Split quantity and unit
    mycursor.execute("UPDATE items SET name = %s, quantity = %s, unit = %s WHERE id = %s", (name, quantity, unit, item_id))  # Update unit in database
    mydb.commit()
    return jsonify({'message': 'Item updated successfully', 'id': item_id})

# API endpoint to delete an item
@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    mycursor.execute("DELETE FROM items WHERE id = %s", (item_id,))
    mydb.commit()
    return jsonify({'message': 'Item deleted successfully', 'id': item_id})

# API endpoint to truncate the items table
@app.route('/refresh', methods=['POST'])
def refresh_items():
    mycursor.execute("TRUNCATE TABLE items")
    mydb.commit()
    return jsonify({'message': 'Items refreshed successfully'})

if __name__ == '__main__':
    app.run(debug=True)
