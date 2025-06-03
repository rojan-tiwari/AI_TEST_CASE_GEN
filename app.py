from flask import Flask, request, jsonify
from flask_cors import CORS
from generate_test_case import generate_test_case 

app = Flask(__name__)
CORS(app)

@app.route('/generate', methods=['POST'])
def generate_test_case_endpoint():
    data = request.json
    requirement = data.get('requirement')
    test_type = data.get('test_type')

    if not requirement or not test_type:
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400

     
    result = generate_test_case(requirement,test_type)

    return jsonify({
        'status': 'success',
        'test_case': result,
    })

if __name__ == '__main__':
    app.run(debug=True)
