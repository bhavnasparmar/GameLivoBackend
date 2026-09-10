export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Lobby
  LOBBY_CREATE: 'lobby:create',
  LOBBY_JOIN: 'lobby:join',
  LOBBY_LEAVE: 'lobby:leave',
  LOBBY_UPDATE: 'lobby:update',
  LOBBY_PLAYER_READY: 'lobby:player_ready',
  LOBBY_START_GAME: 'lobby:start_game',
  LOBBY_KICK_PLAYER: 'lobby:kick_player',
  LOBBY_CHAT_MESSAGE: 'lobby:chat_message',

  // Game Lifecycle & Actions
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_MOVE: 'game:move',
  GAME_TURN_CHANGE: 'game:turn_change',
  GAME_DICE_ROLL: 'game:dice_roll',
  GAME_DICE_ROLLED: 'game:dice_rolled',
  GAME_CARD_DRAW: 'game:card_draw',
  GAME_CARD_PLAYED: 'game:card_played',
  GAME_ACTION: 'game:action',
  GAME_TIMEOUT: 'game:timeout',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_EMOTE: 'game:emote',

  // Player State
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',

  // Chat
  CHAT_JOIN_ROOM: 'chat:join_room',
  CHAT_LEAVE_ROOM: 'chat:leave_room',
  CHAT_SEND_MESSAGE: 'chat:send_message',
  CHAT_NEW_MESSAGE: 'chat:new_message',
  CHAT_TYPING: 'chat:typing',

  // Friends & Social
  FRIEND_STATUS_CHANGE: 'friend:status_change',
  FRIEND_GAME_INVITE: 'friend:game_invite',
  FRIEND_INVITE_RESPONSE: 'friend:invite_response',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
} as const;
