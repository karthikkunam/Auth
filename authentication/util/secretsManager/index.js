import fs from 'fs';
import * as awsSecretsManager from '@7eleven/7boss-secrets-manager';

class SecretsManager {
  async getPublicKey() {
    return process.env.PUBLIC_KEY ? process.env.PUBLIC_KEY : await this.getSecret('publickey');
  }

  async getPrivateKey() {
    return process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : await this.getSecret('privatekey');
  }

  async getSecret(key) {
    try {
      if (process.env.ENVIRONMENT === 'local') {
        if (key === 'privatekey') {
          let privateKey = fs.readFileSync(__dirname + '/private.key', 'utf8');
          return Promise.resolve(privateKey);
        } else if (key === 'publickey') {
          let publicKey = fs.readFileSync(__dirname + '/public.key', 'utf8');
          return Promise.resolve(publicKey);
        }
      }
      if (key) {
        const secretKey = await awsSecretsManager.getSecret(process.env.secretname, key, process.env.aws_region);
        return Promise.resolve(secretKey);
      } else {
        logger.debug(`Failed to get ${key} from AWS`);
        console.log(`Failed to get ${key} from AWS`);
        return Promise.reject(`Failed to get ${key} from AWS`);
      }
    } catch (err) {
      logger.error(`${JSON.stringify(err)}, Error getting secret from secrets manager`);
      console.log(`${JSON.stringify(err)}, Error getting secret from secrets manager`);
      return Promise.reject(`${JSON.stringify(err)}, Error getting secret from secrets manager`);
    }
  }
}

let secretsManager = new SecretsManager();

export { secretsManager };
