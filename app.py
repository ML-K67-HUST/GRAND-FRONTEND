from flask import Flask, request, render_template, make_response, redirect, url_for
# from flask_socketio import SocketIO
import requests

app = Flask(__name__)
# app.config["REDIS_URL"] = "redis://127.0.0.1:6379"
# app.register_blueprint(sse, url_prefix='/stream')

security_on = False

BACKEND_URL = "http://localhost:5050"
AGENT_URL = "http://localhost:5001"
# BACKEND_URL = "https://grand-backend.fly.dev/"

@app.route('/')
def index():
    backend_error = None
    # try:
    #     response = requests.get(f"{BACKEND_URL}/health_check/", timeout=10)
    #     print(response.status_code)
    #     if response.status_code != 200:
    #         backend_error = 'Không thể kết nối tới backend, ứng dụng tạm thời ngừng hoạt động'
    # except Exception as e:
    #     print(f'Lỗi kết nối backend: {e}')
    #     backend_error = 'Không thể kết nối tới backend, ứng dụng tạm thời ngừng hoạt động'
    return render_template('index.html', backend_error=backend_error)

@app.route('/info')
def info():
    username = request.args.get('username', 'Guest')
    userid = request.args.get('userid',1)
    return render_template('info_page.html',username=username, userid=userid)

@app.route('/create-account')
def create_account_page():
    return render_template('login.html', backend_url=BACKEND_URL)

@app.route('/calendar')
def render_calendar():
    try:
        if security_on:
            username = request.args.get('username', 'Guest')
            userid = request.args.get('userid',1)
            access_token = request.cookies.get('access_token')

            if not access_token:
                # return "Unauthorized DMM", 
                print('EO CO ACCESS TOKEN')
                return render_template('index.html')
        
            print(access_token)
            response = requests.request("GET", 
                url=f"{BACKEND_URL}/authorization/verify-token/", 
                headers={
                    'accept': 'application/json',
                    'Authorization': f'Bearer {access_token}',
                    "google-auth":"true",
                }, 
            )
            status_code = response.json().get('status_code',401)
            print(response.json())
            if status_code == 200:
                user = response.json()['user']
                print(user)
                if user:
                    username = user['full_name']
                return render_template('main.html', username=username, userid=userid, backend_url=BACKEND_URL)
            else:
                print('ACCESS TOKEN EXPIRED')
                refresh_token = request.cookies.get('refresh_token')
                if not refresh_token:
                    print('REFRESS TOKEN KO CO')
                    return render_template('login.html', backend_url=BACKEND_URL)
                
                response = requests.request("GET", 
                    url=f"{BACKEND_URL}/authorization/verify-token/", 
                    headers={
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    }, 
                    json={
                        "refresh_token": refresh_token
                    }
                )
                if response.status_code != 200:
                    print('KO VERIFY DC REFRESH TOKEN')
                    return render_template('login.html', backend_url=BACKEND_URL)
            
                new_access_token = response.json()['access_token']
                new_refresh_token = response.json()['refresh_token']

                response_html = make_response(render_template('main.html', username=username, backend_url=BACKEND_URL))

                response_html.set_cookie("access_token", new_access_token, httponly=True, secure=True)
                response_html.set_cookie("refresh_token", new_refresh_token, httponly=True, secure=True)

                return response_html
        else:
            username = request.args.get('username', 'Guest')
            userid = request.args.get('userid',1)
            # access_token = request.cookies.get('access_token')
            return render_template('main.html', username=username, userid=userid, backend_url=BACKEND_URL, agent_url=AGENT_URL)

                
    except Exception as e:
        print(f'Can not authorize, exception : {e}')
        return render_template('login.html', backend_url=BACKEND_URL)

@app.route('/week_view')
def render_week_view():
    return render_template('week_view.html')

@app.route('/month_view')
def render_month_view():
    return render_template('month_view.html')
if __name__ == '__main__':
    app.run(debug=True,port='3000',host='0.0.0.0')
    # socketio.run(app, host='0.0.0.0', port=5001, debug=True)
    
    # asking = "hi"
    # print(chatbot_response(asking,"109356546733291536481"))
