import * as crypto from '@7eleven/7boss-crypto';
import { secretsManager } from '../util/secretsManager/index';

class AuthUtil {
  static async decrypt(encryptedData) {
    const privateKey = await secretsManager.getPrivateKey();
    const decryptedPayload = await crypto.decrypt(encryptedData, privateKey);
    return decryptedPayload;
  }

  static async encrypt(toEncrypt) {
    const publicKey = await secretsManager.getPublicKey();
    const encryptedPayload = await crypto.encrypt(toEncrypt, publicKey);
    return encryptedPayload;
  }
}

export { AuthUtil };
