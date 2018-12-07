(async () => {
  // Redirect to HTTPS  
  if (window.location.protocol !== 'https:') {
    window.location.protocol = 'https:';
  }
  
  let id = null;
  let ping = null;
  let wakeLockObj = null;
  let wakeLockRequest;
  const userAgent = navigator.userAgent;
  
  const log = document.getElementById('log');  
  const track = document.getElementById('track');
  const location = document.getElementById('location');
  const wakelock = document.getElementById('wakelock');  
 
  if ('getWakeLock' in navigator) {
    wakelock.textContent = "Wake lock not created yet.";
    try {
      wakeLockObj = await navigator.getWakeLock('system');
      wakeLockObj.addEventListener('activechange', () => {
        wakelock.textContent = `The ${wakeLockObj.type} wake lock is ${wakeLockObj.active ? 'active' : 'not active'}.`;
      });
    }
    catch (err) {
      console.error('Could not obtain wake lock', err);
    }
  } else {
    wakelock.textContent = "Wake lock not supported.";
  }

  const toggleWakeLock = () => {
    if (!('getWakeLock' in navigator)) {
      return;
    }
    if (wakeLockRequest) {
      wakeLockRequest.cancel();
      wakeLockRequest = null;      
      return;
    }
    wakeLockRequest = wakeLockObj.createRequest();
  };
  
  const stopTracking = () => {        
    navigator.geolocation.clearWatch(id);      
    id = null;
    track.textContent = 'Start tracking';
    location.style.display = 'none';
    clearInterval(ping);
    ping = null;
  };
  
  const startTracking = () => {
    
    ping = setInterval(() => {
      const timestamp = new Date();      
      fetch(`https://thereami.glitch.me/ping?userAgent=${encodeURIComponent(userAgent)}&timestamp=${timestamp}`);      
    }, 10000)
    
    const success = async (pos) => {
      const crd = pos.coords;
      const li = document.createElement('li');
      const timestamp = new Date();
      li.innerHTML = `
          <div>⏱ ${timestamp}</div>
          <div>🌐 ${userAgent}</div>
          <div>🗺 ${crd.latitude}, ${crd.longitude}</div>
          <div>
            <img src="https://maps.googleapis.com/maps/api/staticmap?autoscale=1&size=200x200&maptype=roadmap&key=AIzaSyBWZnCRi6oar3MTjR0HkR1lK52_mTe0Rks&format=png&visual_refresh=true&markers=size:tiny%7Ccolor:0xff0000%7Clabel:%7C${crd.latitude},+${crd.longitude}">
          </div>`;
      log.appendChild(li);
      try {
        fetch(`https://thereami.glitch.me/track?latitude=${crd.latitude}&longitude=${crd.longitude}&userAgent=${encodeURIComponent(userAgent)}&timestamp=${timestamp}`);
      } catch (err) {
        console.error('Logging failed', err);
      }   
    };

    const error = (err) => {
      console.error('ERROR(' + err.code + '): ' + err.message);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    log.innerHTML = '';
    id = navigator.geolocation.watchPosition(success, error, options);  
    track.textContent = 'Stop tracking';      
    location.style.display = 'block';          
  };
  
  track.addEventListener('click', () => {
    toggleWakeLock();    
    if (id) {
      stopTracking();
    } else {
      startTracking();
    }    
  });  
})();