//Scripts used in the Notion API
//Testing scriptds
var options = {
      'method': 'GET',
      'url': 'https://api.notion.com/v1/databases/e5ed425853724b0a94a5532c16a1e3de',
      'headers': {
        'Notion-Version': '2022-02-22',
        'Authorization': 'Bearer '
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      let json=JSON.parse(response.body);
      console.log(json);
      res.json({message:response.body})
    });

    var options = {
      method: "POST",
      url: "https://api.notion.com/v1/search",
      headers: {
        "Notion-Version": "2022-02-22",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          value: "database",
          property: "object",
        },
      }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      let json = JSON.parse(response.body);
      console.log(json);
      res.json({ message: json });
    });
  