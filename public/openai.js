async function requestOAI(method, path, parametersOrCb, cb) {
    if (!openai_api_proxy) {
      throw "openai_api_proxy is not set";
    }
  
    let options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    };
    if (parametersOrCb && typeof parametersOrCb != 'function') {
      options.body = JSON.stringify(parametersOrCb);
    }
  
    let res;
    try {
      res = await fetch(openai_api_proxy + path, options);
    } catch (e) {
      console.error('There was an error communicating to the OpenAI API proxy. Is it offline?');
    }
  
    let data;
    if (res && res.ok) {
      data = await res.json();
    } else if(res && !res.ok) {
      let message = 'The OpenAI API proxy returned an error with response code ' + res.status;
      try {
        let error = await res.json();
        if (error && error.error && error.error.message) {
          message += ': ' + error.error.message;
        }
      } catch (e) {}
      console.error(message);
    }
  
    if (typeof parametersOrCb == 'function') {
      parametersOrCb(data);
    } else if (typeof cb == 'function') {
      cb(data, parametersOrCb);
    }
    return data;
  }
  