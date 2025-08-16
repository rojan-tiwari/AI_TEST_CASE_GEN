from flask import Flask, request, jsonify
from flask_cors import CORS
from generate_test_case import generate_test_case , generate_automation_script
import csv
from io import StringIO

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/generate', methods=['POST'])
def generate_test_case_endpoint():
    
    data = request.json
    if data is None:    
        return jsonify({'status': 'error', 'message': 'Invalid JSON payload'}), 400
    requirement = data.get('requirement')
    test_type = data.get('testType')  

    test_case_output = generate_test_case(requirement, test_type)

    return jsonify({
        'status': 'success',
        'test_case': test_case_output,
    })



@app.route('/upload-csv', methods=['POST', 'OPTIONS'])
def upload_csv():
    print("entered back-end")
    if request.method == 'OPTIONS':
        # CORS preflight response
        return '', 200

    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file uploaded'}), 400

    file = request.files['file']
    progLanguage = request.form.get('progLanguage')

    if file.filename is None:
        return jsonify({'status': 'error', 'message': 'Invalid JSON payload'}), 400
    if not file.filename.endswith('.csv'):
        return jsonify({'status': 'error', 'message': 'Invalid file format. Please upload a CSV'}), 400

    # Read the CSV file content
    stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_input = csv.reader(stream)

    # Skip header
    next(csv_input, None)

    # Extract test cases
    test_cases_list = [" ".join(row) for row in csv_input if row]
    combined_test_cases = "\n".join(test_cases_list)
    print("comb", test_cases_list)

    # Generate automation script
    automation_script = generate_automation_script(progLanguage, combined_test_cases)

    return jsonify({
        'status': 'success',
        'automation_script': automation_script
    })

if __name__ == '__main__':
    app.run(debug=True)
