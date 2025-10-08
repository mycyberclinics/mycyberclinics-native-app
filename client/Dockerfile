# Official Node image (Node 18+ recommended by Expo)
FROM node:22.20

# Set working directory
WORKDIR /app

# Copy only package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your project files
COPY . .

# Install watchman for better file watching (Linux only)
RUN apt-get update && apt-get install -y watchman

# Install required packages
RUN apt-get update && apt-get install -y wget unzip openjdk-11-jdk

# Install Android SDK
RUN mkdir -p /opt/android-sdk && \
    cd /opt/android-sdk && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip && \
    rm cmdline-tools.zip && \
    mkdir -p cmdline-tools && \
    mv cmdline-tools/* cmdline-tools/

# Set ANDROID_HOME and PATH
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses and install platform tools
RUN yes | $ANDROID_HOME/cmdline-tools/bin/sdkmanager --licenses
RUN $ANDROID_HOME/cmdline-tools/bin/sdkmanager "platform-tools" "platforms;android-33"

# Expose Expo ports
EXPOSE 8081 19000 19001 19002

# Start Expo in dev mode (create-expo-app uses local expo scripts)
CMD ["npm", "start"]