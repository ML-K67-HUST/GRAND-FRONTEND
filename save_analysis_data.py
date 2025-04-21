from flask import Blueprint, request, jsonify
import json
import os

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/save-analysis-data', methods=['POST'])
def save_analysis_data():
    """
    Saves the transformed analysis data to data.json file
    """
    try:
        # Get data from request
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Path to data.json file (adjust as needed)
        data_path = os.path.join('static', 'js', 'data.json')
        
        # Write data to file
        with open(data_path, 'w') as f:
            json.dump(data, f, indent=4)
            
        return jsonify({'success': True, 'message': 'Analysis data saved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
# To use this in your main Flask app:
# from save_analysis_data import analytics_bp
# app.register_blueprint(analytics_bp) 