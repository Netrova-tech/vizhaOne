"use client";
import { useCallback,useEffect,useState } from "react";

export interface CartItem {id:string;title:string;price:number;image_url?:string;location?:string;quantity:number;}
const KEY="vizha_cart";
const load=():CartItem[]=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}};
const persist=(items:CartItem[])=>{localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new Event("vizha_cart_change"));};
export function useCart(){
 const[items,setItems]=useState<CartItem[]>([]);
 useEffect(()=>{const sync=()=>setItems(load());sync();window.addEventListener("vizha_cart_change",sync);return()=>window.removeEventListener("vizha_cart_change",sync)},[]);
 const add=useCallback((item:Omit<CartItem,"quantity">)=>{const current=load(),found=current.find(x=>x.id===item.id);const next=found?current.map(x=>x.id===item.id?{...x,quantity:x.quantity+1}:x):[...current,{...item,quantity:1}];persist(next)},[]);
 const remove=useCallback((id:string)=>persist(load().filter(x=>x.id!==id)),[]);
 const setQuantity=useCallback((id:string,quantity:number)=>persist(load().map(x=>x.id===id?{...x,quantity:Math.max(1,quantity)}:x)),[]);
 const clear=useCallback(()=>persist([]),[]);
 const count=items.reduce((sum,item)=>sum+item.quantity,0),total=items.reduce((sum,item)=>sum+(item.price>0?item.price*item.quantity:0),0);
 return{items,add,remove,setQuantity,clear,count,total};
}
