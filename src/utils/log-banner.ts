import {makeLines} from 'nodesplash';
import {readPackageSync} from 'read-pkg';

const logBanner = () => {
  console.log(makeLines({
    user: 'codetheweb',
    repository: 'muse',
    version: readPackageSync().version,
    paypalUser: 'codetheweb',
    githubSponsor: 'codetheweb',
    madeByPrefix: 'Made with 🎶 by ',
    buildDate: process.env.BUILD_DATE ? new Date(process.env.BUILD_DATE) : undefined
  }).join('\n'));
  console.log('\n');
};

export default logBanner;
