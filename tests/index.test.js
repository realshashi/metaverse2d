const BACKEND_URL = "http://localhost:3000";
const WS_URL = "http://localhost:3001";

describe("Authentiation", () => {
  test("User is able to signup only once", async () => {
    const username = `mark-${Math.random()}`;
    const password = "12345678";
    const response = await axios.post(`${BACKEND_URL}-"api/v1/Signup"`, {
      username,
      password,
      type: "admin",
    });
    expect(response.statusCode).toBe(200);
    const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    expect(updatedResponse.statusCode).toBe(400);
  });
  test("User signup fail if the username is empty", async () => {
    const username = null;
    const password = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
    });
    expect(response.statusCode).toBe(400);
  });
  test("Signin succeeds if username and password are correct", async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });
  test("Signin fails if username and password are incorrect", async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    await axios.post(`${BACKEND_URL}-"api/v1/Signup"`, {
      username,
      password,
    });

    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username: "WrongUsername",
      password,
    });
    expect(response.statusCode).toBe(403); //403 unauthorized
    expect(response.body.token).not.toBeDefined();
  });
});

describe("User Information Endpoints", () => {
  let token;
  let avatarId;
  beforeAll(async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    token = response.data.token;
    const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/metadata`, {
      imageUrl: "https://image.com/avatar1.png",
      name: "Timmy",
    });
    avatarId = avatarResponse.data.avatarId;
  });
  test("User is NOT able to update their metadata with a wrong avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/metadata`,
      {
        avatarId: "123123123",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    expect(response.statusCode).toBE(400);
  });
  test("User is able to update their metadata with a right avatar id", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    expect(response.statusCode).toBE(200);
  });
  test("User is able NOT to update their metadata if auth headers is not present", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/metadata`,
      {
        avatarId,
      },
      {
        headers: null,
      }
    );
    expect(response.statusCode).toBE(403);
  });
});
describe("User Avatar Information", () => {
  let token;
  let avatarId;
  let userId;
  beforeAll(async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    userId = signupResponse.data.userId;
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    token = response.data.token;
  });
  test("Get back avatar information of a user", async () => {
    const response = await axios.get(
      `${BACKEND_URL}/api/v1/metadata/bulk?ids=[${userId}]`
    );
    expect(response.data.avatars.length.toBe(1));
    expect(response.data.avatars[0].userId).toBe(userId);
  });
  test("Get available avatars", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    expect(response.data.avatars.length).noit.toBe(0);
    const currentAvatar = response.data.avatars.find((x) => x.id == avatarId);
    expect(currentAvatar).toBedefined();
  });
});

describe("Space Information", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userId;
  let userToken;
  beforeAll(async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupResponse.data.userId;
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    adminToken = response.data.token;
    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;
    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;

    const UserSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signup`,
      {
        username: username + "-user",
        password,
        type: "user",
      }
    );
    userId = UserSignupResponse.data.userId;
    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signin`,
      {
        username: username + "-user",
        password,
      }
    );
    userToken = userSigninResponse.data.token;
  });

  test("User is able create a space", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.data.spaceId).toBeDefined();
  });
  test("User is able create a space without mapId(blank space)", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.data.spaceId).toBeDefined();
  });
  test("User is not able create a space without mapId and dimesions", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.statusCode()).toBe(400);
  });
  test("User is not able create a random space that doesn't exist", async () => {
    const response = await axios.delete(
      `${BACKEND_URL}/api/v1/space/randomIdDoesntExist`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.statusCode()).toBe(400);
  });
  test("User is able delete a space that exist", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const deleteResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(deleteResponse.statusCode).toBe(200);
  });
  test("User should not be able to delete space created by another user", async () => {
    const deleteResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    expect(deleteResponse.statusCode).toBe(403);
  });
  test("Admin have no spaces initially", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`);
    expect(response.data.spaces.length).toBe(0);
  });

  test("Admin have no spaces initially then created a space", async () => {
    const createSpaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space/all}`,
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`);
    const filteredSpace = response.data.spaces.find(
      (x) => x.id == createSpaceResponse.data.spaceId
    );
    expect(response.data.spaces.length).toBe(1);
    expect(filteredSpace).toBeDefined;
  });
});

describe("Arena Endpoints", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userId;
  let userToken;
  let spaceId;
  beforeAll(async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupResponse.data.userId;
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    adminToken = response.data.token;
    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;
    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;
    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      { headers: { authorization: `Bearer ${userToken}` } }
    );
    spaceId = spaceResponse.data.id;

    const UserSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signup`,
      {
        username: username + "-user",
        password,
        type: "user",
      }
    );
    userId = UserSignupResponse.data.userId;
    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signin`,
      {
        username: username + "-user",
        password,
      }
    );
    userToken = userSigninResponse.data.token;
  });
  test("Incorrect spaceId return a 400", async () => {
    const response = axios.get(`${BACKEND_URL}/api/v1/space/123ka23dsds`, {
      headers: {
        authorization: `bearer ${userToken}`,
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test("Correct spaceId return all the elements", async () => {
    const response = axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `bearer ${userToken}`,
      },
    });
    expect(response.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(3);
  });
  test("Delete endpoint is able to delete an element", async () => {
    const response = axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `bearer ${userToken}`,
      },
    });
    await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
      spaceId: spaceId,
      elementId: response.data.elements[0].id,
    });
    expect(response.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(2);
  });
  test("Adding element fails if it lies outside the dimesions ", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        spaceId: spaceId,
        elementId: element1Id,
        x: 10000,
        y: 20000,
      },
      {
        headers: {
          authorization: `bearer ${userToken}`,
        },
      }
    );
    expect(response.statusCode).toBe(404);
  });
  test("Adding element works as expected", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        spaceId: spaceId,
        elementId: element1Id,
        x: 50,
        y: 20,
      },
      {
        headers: {
          authorization: `bearer ${userToken}`,
        },
      }
    );
    expect(response.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(3);
  });
});

describe("Admin Endpoints", () => {
  let adminToken;
  let adminId;
  let userId;
  let userToken;
  beforeAll(async () => {
    const username = `mark-${Math.random()}`;
    const password = "123456";
    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/Signup`, {
      username,
      password,
      type: "admin",
    });
    adminId = signupResponse.data.userId;
    const response = await axios.post(`${BACKEND_URL}/api/v1/Signin`, {
      username,
      password,
    });
    adminToken = response.data.token;

    const UserSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signup`,
      {
        username,
        password,
        type: "admin",
      }
    );
    userId = UserSignupResponse.data.userId;
    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/Signin`,
      {
        username,
        password,
      }
    );
    userToken = userSigninResponse.data.token;
  });
  test("User is not able to hit endpoints", async () => {
    const elementResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [],
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `bearer ${userToken}`,
        },
      }
    );
    const updateElementResponse = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      },
      {
        headers: {
          authorization: `bearer ${userToken}`,
        },
      }
    );

    expect(elementResponse.statusCode).toBe(403);
    expect(mapResponse.statusCode).toBe(403);
    expect(avatarResponse.statusCode).toBe(403);
    expect(updateElementResponse.statusCode).toBe(403);
  });
  test("User is not able to hit endpoints", async () => {
    const elementResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `bearer ${adminToken}`,
        },
      }
    );

    expect(elementResponse.statusCode).toBe(200);
    expect(mapResponse.statusCode).toBe(200);
    expect(avatarResponse.statusCode).toBe(200);
  });
  test("Admin is able to update the imageUrl for an element", async () => {
    const elementResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        static: false,
        height: 1,
        width: 1,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const updateElementResponse = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
      },
      {
        headers: {
          authorization: `bearer ${adminToken}`,
        },
      }
    );

    expect(updateElementResponse.statusCode).toBE(200);
  });
});

describe("Websocket tests", () => {
  let adminToken;
  let adminUserId;
  let userToken;
  let adminId;
  let userId;
  let mapId;
  let element1Id;
  let element2Id;
  let spaceId;
  let ws1;
  let ws2;
  let ws1Messages = [];
  let ws2Messages = [];
  let userX;
  let userY;
  let adminX;
  let adminY;

  function waitForAndPopLatestMessage(messageArray) {
    return new Promise((resolve) => {
      if (messageArray.length > 0) {
        resolve(messageArray.shift());
      } else {
        let interval = setInterval(() => {
          if (messageArray.length > 0) {
            resolve(messageArray.shift());
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }

  async function setupHTTP() {
    const username = `kirat-${Math.random()}`;
    const password = "123456";
    const adminSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username,
        password,
        type: "admin",
      }
    );

    const adminSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username,
        password,
      }
    );

    adminUserId = adminSignupResponse.data.userId;
    adminToken = adminSigninResponse.data.token;
    console.log("adminSignupResponse.status");
    console.log(adminSignupResponse.status);

    const userSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username + `-user`,
        password,
        type: "user",
      }
    );
    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username: username + `-user`,
        password,
      }
    );
    userId = userSignupResponse.data.userId;
    userToken = userSigninResponse.data.token;
    console.log("useroktne", userToken);
    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "Defaul space",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;

    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    console.log(spaceResponse.status);
    spaceId = spaceResponse.data.spaceId;
  }
  async function setupWs() {
    ws1 = new WebSocket(WS_URL);

    ws1.onmessage = (event) => {
      console.log("got back adata 1");
      console.log(event.data);

      ws1Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws1.onopen = r;
    });

    ws2 = new WebSocket(WS_URL);

    ws2.onmessage = (event) => {
      console.log("got back data 2");
      console.log(event.data);
      ws2Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws2.onopen = r;
    });
  }

  beforeAll(async () => {
    await setupHTTP();
    await setupWs();
  });

  test("Get back ack for joining the space", async () => {
    console.log("insixce first test");
    ws1.send(
      JSON.stringify({
        type: "join",
        payload: {
          spaceId: spaceId,
          token: adminToken,
        },
      })
    );
    console.log("insixce first test1");
    const message1 = await waitForAndPopLatestMessage(ws1Messages);
    console.log("insixce first test2");
    ws2.send(
      JSON.stringify({
        type: "join",
        payload: {
          spaceId: spaceId,
          token: userToken,
        },
      })
    );
    console.log("insixce first test3");

    const message2 = await waitForAndPopLatestMessage(ws2Messages);
    const message3 = await waitForAndPopLatestMessage(ws1Messages);

    expect(message1.type).toBe("space-joined");
    expect(message2.type).toBe("space-joined");
    expect(message1.payload.users.length).toBe(0);
    expect(message2.payload.users.length).toBe(1);
    expect(message3.type).toBe("user-joined");
    expect(message3.payload.x).toBe(message2.payload.spawn.x);
    expect(message3.payload.y).toBe(message2.payload.spawn.y);
    expect(message3.payload.userId).toBe(userId);

    adminX = message1.payload.spawn.x;
    adminY = message1.payload.spawn.y;

    userX = message2.payload.spawn.x;
    userY = message2.payload.spawn.y;
  });

  test("user should not be able to move across the boundary of the wall", async () => {
    ws1.send(
      JSON.stringify({
        type: "movement",
        payload: {
          x: 1000000,
          y: 100000,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(messsage.type).toBe("movement-rejected");
    expect(message.payload.x).toBe(adminX);
    expect(message.payload.y).toBe(adminY);
  });

  test("Correct movement should be broadcasted to the other sockets in the room", async () => {
    ws1.send(
      JSON.stringify({
        type: "movement",
        payload: {
          x: adminX + 1,
          y: adminY,
          userId: adminId,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(messsage.type).toBe("movement");
    expect(message.payload.x).toBe(adminX + 1);
    expect(message.payload.y).toBe(adminY);
  });

  test("User should not be able to move two blocks at the same time", async () => {
    ws1.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: adminX + 2,
          y: adminY,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws1Messages);
    expect(message.type).toBe("movement-rejected");
    expect(message.payload.x).toBe(adminX);
    expect(message.payload.y).toBe(adminY);
  });

  test("if a user leaves other user receives a leave event", async () => {
    ws1.close();

    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(messsage.type).toBe("user-left");
    expect(message.payload.userId).toBE(adminUserId);
  });
});
