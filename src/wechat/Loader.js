import Wechat from './Wechat'
import sha1 from 'sha1'
import getRawBody from 'raw-body'
import msgParser from '../xml/parser'
import formater from '../xml/formatter'
import {handler as defaultHandler} from '../handler/handler' 

let wLoader = (config,handler)=>{
	// instance of Wechat
	let wechat = new Wechat(config)

	// return a middleware async fn
	return async(ctx,next)=>{

		// notice this token is for encrypt not access_token
		const token = 'chuxdesign'
		let{signature,timestamp,nonce,echostr} = ctx.query;
		if(!signature || !timestamp || ! nonce){
			// not from wechat
			ctx.body = "wrong place"
			return
		}
		let sha = sha1([token,timestamp,nonce].sort().join(''))

		// get for wechat server test
		if(ctx.method==='GET'){
			if(sha === signature){
				ctx.body = echostr
			}

			else{
				ctx.body = "encrypt wrong!"
			}
		}
		// post for logic layer
		else if(ctx.method==='POST'){
			if(sha!==signature){
				ctx.body = 'wrong place'
				return
			}
			// get rawData
			let rawData = await getRawBody(ctx.req,{
				length:ctx.length,
                limit:'1mb',
                encoding:ctx.charset
			})

			// parse xml
			let xmlData = await msgParser(rawData)

			// format xml
			let xml = formater(xmlData.xml)
			console.info("xml obj : ",xml)

			// set defaulthandler
			if(!handler) handler = defaultHandler

			// handle the request
			let replyXML = await handler(xml)

			// reply xml
			ctx.status = 200
			ctx.type = 'application/xml'
			ctx.body = replyXML
			
		}

	}
}

export default wLoader