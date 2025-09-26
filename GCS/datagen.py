import csv
import random
from datetime import datetime, timedelta

# --- Configuration ---
OUTPUT_FILE = 'telemetry_data.csv'
NUM_DATA_POINTS = 100
TEAM_ID = 3101
START_TIME_STR = '01:32:00'

# --- Main Script ---
def generate_telemetry_data():
    """
    Generates a CSV file with simulated telemetry data for a mock satellite mission.
    """
    # Define the headers for the CSV file
    headers = [
        'Team ID', 'Mission Time', 'Packet Count', 'Mode', 'State', 'Altitude',
        'Temperature', 'Pressure', 'Voltage', 'Gyro Roll', 'Gyro Pitch', 'Gyro Yaw',
        'Accel Roll', 'Accel Pitch', 'Accel Yaw', 'Mag Roll', 'Mag Pitch', 'Mag Yaw',
        'Auto Rotation', 'GPS Time', 'GPS Altitude', 'GPS Latitude', 'GPS Longitude',
        'GPS Satellites', 'Command Status'
    ]

    # Convert start time string to a datetime object to easily handle increments
    # A dummy date is used since we only care about the time part.
    start_time = datetime.strptime(START_TIME_STR, '%H:%M:%S')

    try:
        # Open the file in write mode
        with open(OUTPUT_FILE, 'w', newline='') as csvfile:
            # Create a CSV writer object
            writer = csv.writer(csvfile)

            # Write the header row
            writer.writerow(headers)

            # Generate and write the specified number of data points
            for i in range(1, NUM_DATA_POINTS + 1):
                # Calculate the current time for this data point
                mission_time_obj = start_time + timedelta(seconds=i - 1)
                mission_time_str = mission_time_obj.strftime('%H:%M:%S')

                # Generate random data for each field
                altitude = round(random.uniform(800.0, 1200.0), 2)
                
                # Create a list representing the data row
                row_data = [
                    TEAM_ID,                                  # Team ID
                    mission_time_str,                         # Mission Time
                    i,                                        # Packet Count
                    random.choice(['F', 'S']),                # Mode (Flight/Standby)
                    random.choice(['ASCENT', 'DESCENT']),     # State
                    altitude,                                 # Altitude
                    round(random.uniform(15.0, 35.0), 2),     # Temperature (°C)
                    round(random.uniform(980.0, 1020.0), 2),  # Pressure (hPa)
                    round(random.uniform(4.5, 5.5), 2),       # Voltage (V)
                    round(random.uniform(-180.0, 180.0), 4),  # Gyro Roll
                    round(random.uniform(-180.0, 180.0), 4),  # Gyro Pitch
                    round(random.uniform(-180.0, 180.0), 4),  # Gyro Yaw
                    round(random.uniform(-2.0, 2.0), 4),      # Accel Roll (g)
                    round(random.uniform(-2.0, 2.0), 4),      # Accel Pitch (g)
                    round(random.uniform(-2.0, 2.0), 4),      # Accel Yaw (g)
                    round(random.uniform(-1.0, 1.0), 4),      # Mag Roll (Gauss)
                    round(random.uniform(-1.0, 1.0), 4),      # Mag Pitch (Gauss)
                    round(random.uniform(-1.0, 1.0), 4),      # Mag Yaw (Gauss)
                    random.choice(['ON', 'OFF']),             # Auto Rotation
                    mission_time_str,                         # GPS Time (same as mission time)
                    altitude,                                 # GPS Altitude (same as altitude)
                    round(random.uniform(17.40, 17.50), 6),   # GPS Latitude
                    round(random.uniform(78.45, 78.55), 6),   # GPS Longitude
                    random.randint(5, 12),                    # GPS Satellites
                    random.choice(['ACCEPTED', 'PENDING'])    # Command Status
                ]
                
                # Write the row to the file
                writer.writerow(row_data)

        print(f"Successfully generated '{OUTPUT_FILE}' with {NUM_DATA_POINTS} data points.")

    except IOError as e:
        print(f"Error writing to file: {e}")

# Run the function when the script is executed
if __name__ == '__main__':
    generate_telemetry_data()
