"use strict";
import { post, get } from 'request';
import { load } from 'cheerio';
import { parse } from 'set-cookie-parser';
import { serialize } from 'cookie-parse';
import { vultr } from './Config';

export class serverStatus extends vultr {
	constructor() {
		super();
		this.start();
	}
	GetHiddenData() {
		return new Promise((resolve) => {
			get({
				url: "https://my.vultr.com/",
				headers: {
					"user-agent": this.user_agent
				}
			}, (err, res, html) => {
				if(err) throw err;
				else {
					let $ = load(html);
					resolve($("input[name='action']").val());
				}
			});
		});
	}
	vultrLogin(action) {
		return new Promise((resolve) => {
			post({
				url: "https://my.vultr.com/",
				headers: {
					"user-agent": this.user_agent
				},
				form: {"action": action, "username": this.userID, "password": this.userPW }
			}, (err, res, html) => {
				if(err) throw err;
				else resolve(res.headers['set-cookie']);
			});
		});
		
	}
	getServerData() {
		return new Promise((resolve) => {
			get({
				url: "https://my.vultr.com/subs/?SUBID=" + this.serverID,
				headers: {
					"cookie": this.cookie,
					"user-agent": this.user_agent
				}
			}, (err, res, html) => {
				if(err) throw err;
				else resolve(html);
			});
		});
	}
	setCookie(cookie) {
		let retSt = '';
		for(let i = 0; i < cookie.length; i++)
			retSt += serialize(cookie[i]['name'], cookie[i]['value']) + ";";
		return retSt;
	}
	remainAmount() {
		return new Promise((resolve) => {
			get({
				url: "https://my.vultr.com/billing/",
				headers: {
					"cookie": this.cookie,
					"user-agent": this.user_agent
				}
			}, (err, res, html) => {
				if(err) throw err;
				else {
					let $ = load(html);
					resolve($("a[style='color:#616366;']").text().trim());
				}
			});
		});
	}
	async start() {
		this.cookie = this.setCookie(parse(await this.vultrLogin(await this.GetHiddenData()), {decodeValues: true}));
		let $ = load(await this.getServerData());
		let remain = await this.remainAmount();
		console.log("[*] Vultr.com - '" + this.userID + "' Account Server Information");
		console.log("Bandwidth Usage: " + $(".boxLink span:nth-child(1):nth-last-child(2), .boxLink span:nth-child(2)").text());
		console.log("Current Charges: " + $(".boxLink span:nth-child(1):nth-last-child(1)").text().replace("--", ""));
		console.log("Remaining Amount: " + remain);
	}
}

new serverStatus();
