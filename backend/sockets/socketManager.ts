import { Server } from 'socket.io';
import http from 'http';
import { Router } from 'express';
import {
  Feature,
  MultiPolygon,
  Point,
  Polygon,
  Properties,
  booleanPointInPolygon,
  polygon,
} from '@turf/turf';
import Siren from '../models/Siren';
const bodyParser = require('body-parser');

require('body-parser-xml')(bodyParser);

var io: Server;

// Map to track socket ID to siren ID
const socketToSirenMap = new Map<string, string>();

var socketManager = {
  init: (server: any) => console.log('not initialized'),
};

socketManager.init = (server: http.Server) => {
  io = new Server(server, {
    pingInterval: 2000,
    pingTimeout: 3000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', socket => {
    console.log('New connection:', socket.id);

    // Handle siren registration
    socket.on('siren-register', async (sirenId: string) => {
      console.log(`Siren ${sirenId} registered with socket ${socket.id}`);

      // Store the mapping
      socketToSirenMap.set(socket.id, sirenId);

      // Update siren status to active
      try {
        const updatedSiren = await Siren.findOneAndUpdate(
          { id: sirenId },
          {
            status: 'active',
            lastChecked: new Date(),
          },
          { new: true }
        );

        if (updatedSiren) {
          console.log(`Siren ${sirenId} status updated to active`);
          // Notify all clients about the siren status change
          io.emit('siren-status-change', {
            sirenId,
            status: 'active',
            lastChecked: updatedSiren.lastChecked,
          });
        } else {
          console.log(`Siren ${sirenId} not found in database`);
        }
      } catch (error) {
        console.error(`Error updating siren ${sirenId} status:`, error);
      }
    });

    socket.on('siren-control', data => {
      console.log(`Siren incoming data:`, data);
      let { sirenId, action, alertType, gapAudio, message, connType, language } = data;
      if (!gapAudio) gapAudio = 0;
      if (!language) language = 'hi';
      io.emit(`siren-control-siren`, {
        sirenId,
        action,
        alertType,
        gapAudio,
        connType,
        language,
        message,
      });
    });

    socket.on('siren-control-multi', data => {
      console.log(`Siren incoming data:`, data);
      let { sirenIds, action, alertType, gapAudio, message, connType, language } = data;
      if (!gapAudio) gapAudio = 0;
      if (!language) language = 'hi';
      io.emit(`siren-control-multi-siren`, {
        sirenIds,
        action,
        message,
        alertType,
        gapAudio,
        connType,
        language,
      });
    });

    socket.on('siren-ack-on', async data => {
      const { sirenId, alertType, message } = data;
      console.log(`Siren ${sirenId} on`);

      // Update the playing status and log the 'on' event
      try {
        await Siren.findOneAndUpdate(
          { id: sirenId },
          {
            $set: { playing: true, lastChecked: new Date() },
            $push: {
              logs: {
                action: 'on',
                timestamp: new Date(),
                alertType,
                message,
              },
            },
          }
        );
        console.log(`Logged siren ${sirenId} on event`);
      } catch (error) {
        console.error(`Error updating or logging siren ${sirenId} on status:`, error);
      }

      io.emit(`siren-acked`, { sirenId, running: true });
    });

    socket.on('siren-ack-off', async data => {
      const sirenId = data.sirenId || data;
      console.log(`Siren ${sirenId} off`);

      // Update the playing status and log the 'off' event
      try {
        await Siren.findOneAndUpdate(
          { id: sirenId },
          {
            $set: { playing: false, lastChecked: new Date() },
            $push: {
              logs: {
                action: 'off',
                timestamp: new Date(),
              },
            },
          }
        );
        console.log(`Logged siren ${sirenId} off event`);
      } catch (error) {
        console.error(`Error updating or logging siren ${sirenId} off status:`, error);
      }

      io.emit(`siren-acked`, { sirenId, running: false });
    });

    socket.on('connection-manager', data => {
      const { sirenId, isOnline } = data;
      io.emit(`connection-manager-push`, { sirenId, isOnline });
    });

    socket.on('siren-status-check', async (sirenId: string) => {
      try {
        const siren = await Siren.findOne({ id: sirenId });
        if (siren) {
          socket.emit('siren-status-update', {
            sirenId: siren.id,
            status: siren.status,
            playing: siren.playing,
            lastChecked: siren.lastChecked,
          });
        }
      } catch (error) {
        console.error(`Error checking siren ${sirenId} status:`, error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);

      // Check if the disconnected socket was associated with a siren
      const sirenId = socketToSirenMap.get(socket.id);
      if (sirenId) {
        console.log(`Siren ${sirenId} disconnected`);
        // Remove from the map
        socketToSirenMap.delete(socket.id);
        io.emit('siren-status-change', {
          sirenId,
          status: 'inactive',
          lastChecked: new Date(),
        });
        // Update siren status to inactive
        try {
          const updatedSiren = await Siren.findOneAndUpdate(
            { id: sirenId },
            {
              status: 'inactive',
              lastChecked: new Date(),
            },
            { new: true }
          );

          if (updatedSiren) {
            console.log(`Siren ${sirenId} status updated to inactive`);
          }
        } catch (error) {
          console.error(`Error updating siren ${sirenId} status:`, error);
        }
      }
    });
  });
};

const controllerRouter = Router();

const isMarkerInsidePolygon = (
  sirenPoint: Point,
  polygon: Feature<MultiPolygon, Properties> | Feature<Polygon, Properties>
): boolean => {
  const isInside = booleanPointInPolygon(sirenPoint, polygon.geometry);
  return isInside;
};

export interface SirenDataI {
  id: string;
  name: string;
  color: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'warning' | 'alert';
  lastChecked: Date;
  district: string;
  block: string;
  parent_site: string;
}

controllerRouter.post('/platform', async (req, res) => {
  try {
    const data = req.body;
    let { polygonData, message, sirenControl, alertType, gapAudio, language, frequency } = data;
    const listOfItems: SirenDataI[] = [];
    if (!frequency) frequency = 1;
    const sirenData = await Siren.find();
    polygonData.map((polygonString: any) => {
      const coordinates = polygonString.split(' ').map((coord: string) => {
        const [lat, lng] = coord.split(',').map(parseFloat);
        return [lat, lng];
      });
      sirenData.map(siren => {
        if (
          isMarkerInsidePolygon(
            { coordinates: [siren.location.lat, siren.location.lng], type: 'Point' },
            polygon([coordinates])
          )
        ) {
          io.emit('siren-control-siren', {
            sirenId: siren.id,
            action: sirenControl === 'on' ? (message.length > 0 ? message : 'on') : 'off',
            alertType,
            gapAudio,
            frequency,
            language: language ? language : 'hi',
          });
          listOfItems.push({
            id: siren.id,
            name: siren.name,
            color: siren.color,
            location: siren.location,
            status: siren.status,
            lastChecked: siren.lastChecked,
            district: siren.district,
            block: siren.block,
            parent_site: siren.parent_site,
          });
        }
      });
    });

    res.status(200).json({ success: true, sirensActivated: listOfItems });
  } catch (err: any) {
    res.status(500).json({ success: false });
  }
});

controllerRouter.post('/cap', bodyParser.xml(), async (req: any, res: any) => {
  try {
    const data = req.body;
    const polygonData = data.alert.info[0].area[0].polygon;
    const listOfItems: SirenDataI[] = [];
    const sirenData = await Siren.find();
    let message = '';
    let sirenControl = '';
    let alertType = '';
    let gapAudio = 0;
    let language = 'hi';
    let frequency = 1;
    console.log(data.alert.info[0].parameter);

    for (let param of data.alert.info[0].parameter) {
      if (param.valueName[0] === 'message') {
        message = param.value[0];
      } else if (param.valueName[0] === 'sirenControl') {
        sirenControl = param.value[0];
      } else if (param.valueName[0] === 'alertType') {
        alertType = param.value[0];
      } else if (param.valueName[0] === 'gapAudio') {
        gapAudio = param.value[0];
      } else if (param.valueName[0] === 'frequency') {
        frequency = param.value[0];
      }
    }
    if (data.alert.info[0].language && data.alert.info[0].language.length > 0) {
      language = data.alert.info[0].language[0];
    }
    if (data.alert.info[0].headline && data.alert.info[0].headline.length > 0) {
      message = data.alert.info[0].headline[0];
    }
    polygonData.map((polygonString: any) => {
      const coordinates = polygonString.split(' ').map((coord: string) => {
        const [lat, lng] = coord.split(',').map(parseFloat);
        return [lat, lng];
      });
      sirenData.map(siren => {
        if (
          isMarkerInsidePolygon(
            { coordinates: [siren.location.lat, siren.location.lng], type: 'Point' },
            polygon([coordinates])
          )
        ) {
          io.emit('siren-control-siren', {
            sirenId: siren.id,
            action: sirenControl === 'on' ? (message.length > 0 ? message : 'on') : 'off',
            alertType,
            gapAudio,
            language,
            frequency,
          });
          listOfItems.push(siren as any);
        }
      });
    });

    res.status(200).json({ success: 'true', sirensActivated: listOfItems });
  } catch (err: any) {
    res.status(500).json({ success: false });
  }
});

// New endpoint to fetch siren logs
controllerRouter.get('/logs/:sirenId?', async (req, res) => {
  try {
    const sirenId = req.params.sirenId;
    let sirens;
    if (sirenId) {
      // Fetch logs for a specific siren
      sirens = await Siren.findOne({ id: sirenId }).select('id name logs');
    } else {
      // Fetch logs for all sirens
      sirens = await Siren.find().select('id name logs');
    }
    if (!sirens) {
      return res.status(404).json({ error: 'No sirens found' });
    }
    res.status(200).json(sirens);
  } catch (err: any) {
    console.error('Error fetching siren logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export { controllerRouter, io };

export default socketManager;