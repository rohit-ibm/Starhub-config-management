from backend import create_app
import argparse
import os


parser = argparse.ArgumentParser()



parser.add_argument("-sevonenmsresthost", default=os.getenv("SEVONE_NMS_REST_HOST",'9.42.110.15:15673'),
                            help="Log file location. Default: 'localhost'")
namespace, otherArgs = parser.parse_known_args()
app = create_app(namespace)

if __name__ == '__main__':

    app.run(debug=True, port=5000)
